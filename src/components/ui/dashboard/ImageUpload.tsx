import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	rectSortingStrategy,
	SortableContext,
	useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ASSETS_BASE_URL } from "~/constants/urls";
import { uploadProductImage } from "~/server_functions/dashboard/store/uploadProductImage";
import { Button } from "../shared/Button";
import { Textarea } from "../shared/TextArea";

interface ImageUploadProps {
	currentImages: string; // comma-separated string from the form
	onImagesChange: (images: string, deletedImages?: string[]) => void; // callback to update the form
	folder?: string;
	slug?: string; // product slug for subdirectory organization
	categorySlug?: string; // category slug for proper path structure
	productName?: string; // product name for proper file naming
}

interface SortableImageItemProps {
	image: string;
	index: number;
	onRemove: (index: number) => Promise<void>;
}

function SortableImageItem({ image, index, onRemove }: SortableImageItemProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: image });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className="relative group bg-background rounded-lg border border-border overflow-hidden"
		>
			<div className="aspect-square relative">
				<img
					src={`${ASSETS_BASE_URL}/${image}`}
					alt={`Product ${index + 1}`}
					className="w-full h-full object-cover"
					onLoad={() => {}}
					onError={(e) => {
						e.currentTarget.src =
							"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-size='14'%3ENo Image%3C/text%3E%3C/svg%3E";
					}}
				/>
				{/* Drag Handle */}
				<button
					type="button"
					{...attributes}
					{...listeners}
					className="absolute top-1 left-1 p-1.5 bg-primary text-primary-foreground rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
					title="Перетащите для перемещения"
				>
					<GripVertical className="w-3 h-3" />
				</button>
				{/* Delete Button */}
				<button
					type="button"
					onClick={() => onRemove(index)}
					className="absolute top-1 right-1 p-1.5 bg-destructive text-destructive-foreground rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90 cursor-pointer"
					title="Убрать изображение"
				>
					<Trash2 className="w-3 h-3" />
				</button>
			</div>
			<div className="p-2 bg-background border-t border-border">
				<p className="text-xs truncate font-mono text-muted-foreground">
					{image.split("/").pop()}
				</p>
			</div>
		</div>
	);
}

export function ImageUpload({
	currentImages,
	onImagesChange,
	folder = "products",
	slug,
	categorySlug,
	productName,
}: ImageUploadProps) {
	// Target max uploaded size (~700KB)
	const TARGET_MAX_BYTES = 700 * 1024;
	const [isUploading, setIsUploading] = useState(false);
	const [imageList, setImageList] = useState<string[]>([]);
	const [showTextarea, setShowTextarea] = useState(false);
	const [deletedImages, setDeletedImages] = useState<string[]>([]);
	const [isDragging, setIsDragging] = useState(false);
	const [isPasting, setIsPasting] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const fileInputId =
		typeof crypto !== "undefined" && crypto.randomUUID
			? crypto.randomUUID()
			: `file-input-${Date.now()}`;

	// Drag and drop sensors
	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor),
	);

	// Helper function to generate proper file name
	const generateProperFileName = useCallback(
		(extension: string = "webp"): string => {
			// If we have categorySlug and productName, use the proper structure
			if (categorySlug && productName) {
				// Sanitize the product name for file system
				const sanitizedProductName = productName
					.toLowerCase()
					.replace(/[^a-z0-9]/g, "-")
					.replace(/-+/g, "-")
					.replace(/^-|-$/g, "");

				return `${sanitizedProductName}.${extension}`;
			}

			// Fallback to original logic for backward compatibility
			const timestamp = Date.now();
			return `pasted-image-${timestamp}.${extension}`;
		},
		[categorySlug, productName],
	);

	// Parse comma-separated string into array
	useEffect(() => {
		const images = currentImages
			? currentImages
					.split(",")
					.map((img) => img.trim())
					.filter(Boolean)
			: [];

		setImageList(images);
		// Reset deleted images when currentImages changes (e.g., modal reopened)
		setDeletedImages([]);
	}, [currentImages]);

	// --- Client-side image compression & WebP conversion ---
	const compressToWebP = useCallback(async (file: File): Promise<File> => {
		const loadImageElement = (srcFile: File): Promise<HTMLImageElement> =>
			new Promise((resolve, reject) => {
				const url = URL.createObjectURL(srcFile);
				const img = new Image();
				img.onload = () => {
					URL.revokeObjectURL(url);
					resolve(img);
				};
				img.onerror = (e) => {
					URL.revokeObjectURL(url);
					reject(e);
				};
				img.src = url;
			});

		const canvasToBlob = (
			canvas: HTMLCanvasElement,
			type: string,
			quality: number,
		): Promise<Blob> =>
			new Promise((resolve, reject) => {
				canvas.toBlob(
					(blob) => {
						if (!blob) return reject(new Error("Failed to create blob"));
						resolve(blob);
					},
					type,
					quality,
				);
			});

		try {
			// If already WebP and reasonably small, skip heavy work
			const alreadyWebp = file.type === "image/webp";
			if (alreadyWebp && file.size <= 1.4 * 1024 * 1024) return file;

			const img = await loadImageElement(file);

			// Resize if too large
			const maxDimension = 3000; // cap very large images
			let { width, height } = img;
			if (width > maxDimension || height > maxDimension) {
				const ratio = Math.min(maxDimension / width, maxDimension / height);
				width = Math.round(width * ratio);
				height = Math.round(height * ratio);
			}

			const canvas = document.createElement("canvas");
			canvas.width = width;
			canvas.height = height;
			const ctx = canvas.getContext("2d");
			if (!ctx) return file;
			ctx.drawImage(img, 0, 0, width, height);

			// Iterate quality to fit under target size (~700KB)
			let quality = 0.85;
			let blob = await canvasToBlob(canvas, "image/webp", quality);
			while (blob.size > TARGET_MAX_BYTES && quality > 0.4) {
				quality -= 0.05;
				blob = await canvasToBlob(canvas, "image/webp", quality);
			}

			const ext = ".webp";
			const baseName = (
				file.name.includes(".")
					? file.name.slice(0, file.name.lastIndexOf("."))
					: file.name
			).replace(/\.+$/, "");
			const newName = `${baseName}${ext}`;
			return new File([blob], newName, { type: "image/webp" });
		} catch (_e) {
			// Fallback to original file on any failure
			return file;
		}
	}, []);

	const validateAndUploadFile = useCallback(
		async (file: File) => {
			// Validate file type
			const allowedTypes = [
				"image/jpeg",
				"image/jpg",
				"image/png",
				"image/webp",
			];
			if (!allowedTypes.includes(file.type)) {
				toast.error("Invalid file type. Only JPEG, PNG, and WebP are allowed.");
				return;
			}

			// Validate file size
			const defaultMaxSizeMB = 5;
			const maxSize = defaultMaxSizeMB * 1024 * 1024;
			if (file.size > maxSize) {
				toast.error(`File size must be less than ${defaultMaxSizeMB}MB`);
				return;
			}

			setIsUploading(true);

			try {
				// Compress & convert to WebP before uploading
				const processed = await compressToWebP(file);

				// Hard guard: if still above target, ask user to try a smaller image
				if (processed.size > TARGET_MAX_BYTES) {
					toast.error(
						"Image is too large after compression. Please use a smaller image (~700KB max).",
					);
					setIsUploading(false);
					return;
				}

				// Convert file to base64
				const reader = new FileReader();
				reader.onloadend = async () => {
					try {
						const base64String = reader.result as string;

						const result = await uploadProductImage({
							data: {
								fileData: base64String,
								fileName: processed.name,
								fileType: processed.type,
								fileSize: processed.size,
								folder,
								slug,
								categorySlug,
								productName,
							},
						});

						if (result.success) {
							toast.success("Image uploaded successfully!");
							// Add new image to the list
							const newImages = [...imageList, result.filename];

							setImageList(newImages); // Update local state immediately for instant preview
							onImagesChange(newImages.join(", "));
							// Reset the form
							if (fileInputRef.current) {
								fileInputRef.current.value = "";
							}
						}
					} catch (_error) {
						toast.error(
							error instanceof Error ? error.message : "Failed to upload image",
						);
					} finally {
						setIsUploading(false);
					}
				};

				reader.onerror = () => {
					toast.error("Failed to read file");
					setIsUploading(false);
				};

				reader.readAsDataURL(processed);
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : "Failed to upload image",
				);
				setIsUploading(false);
			}
		},
		[
			imageList,
			onImagesChange,
			folder,
			slug,
			categorySlug,
			productName,
			compressToWebP,
		],
	);

	// Handle clipboard paste
	const handleClipboardPaste = useCallback(
		async (event: ClipboardEvent) => {
			// Check if we're in the image upload context
			const isInImageUploadContext =
				containerRef.current?.contains(document.activeElement) ||
				document.activeElement?.closest("[data-image-upload-container]") ||
				document.activeElement?.closest('[role="dialog"]') || // Modal context
				document.activeElement?.closest(".image-upload-area"); // Direct upload area

			if (!isInImageUploadContext) {
				return;
			}

			const clipboardData = event.clipboardData;
			if (!clipboardData) return;

			const items = clipboardData.items;

			// Look for image data in clipboard
			for (let i = 0; i < items.length; i++) {
				const item = items[i];

				if (item.type.startsWith("image/")) {
					event.preventDefault();
					setIsPasting(true);

					try {
						const file = item.getAsFile();

						if (file) {
							// Generate a proper filename based on product info
							const extension = file.type.split("/")[1] || "png";
							const filename = generateProperFileName(extension);

							// Create a new File object with the proper name
							const namedFile = new File([file], filename, { type: file.type });

							await validateAndUploadFile(namedFile);
						} else {
							toast.error("Could not extract image from clipboard");
						}
					} catch (_error) {
						toast.error("Failed to paste image from clipboard");
					} finally {
						setIsPasting(false);
					}
					break;
				}
			}
		},
		[validateAndUploadFile, generateProperFileName],
	);

	// Add clipboard event listener
	useEffect(() => {
		document.addEventListener("paste", handleClipboardPaste);
		return () => {
			document.removeEventListener("paste", handleClipboardPaste);
		};
	}, [handleClipboardPaste]);

	// Alternative: Add paste event directly to the container
	const handleContainerPaste = useCallback(
		async (event: React.ClipboardEvent) => {
			event.preventDefault();

			const clipboardData = event.clipboardData;
			if (!clipboardData) return;

			const items = clipboardData.items;

			// Look for image data in clipboard
			for (let i = 0; i < items.length; i++) {
				const item = items[i];

				if (item.type.startsWith("image/")) {
					setIsPasting(true);

					try {
						const file = item.getAsFile();

						if (file) {
							// Generate a proper filename based on product info
							const extension = file.type.split("/")[1] || "png";
							const filename = generateProperFileName(extension);

							// Create a new File object with the proper name
							const namedFile = new File([file], filename, { type: file.type });

							await validateAndUploadFile(namedFile);
						} else {
							toast.error("Could not extract image from clipboard");
						}
					} catch (_error) {
						toast.error("Failed to paste image from clipboard");
					} finally {
						setIsPasting(false);
					}
					break;
				}
			}
		},
		[validateAndUploadFile, generateProperFileName],
	);

	const handleFileChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files?.[0];
			if (!file) return;
			validateAndUploadFile(file);
		},
		[validateAndUploadFile],
	);

	const handleDragOver = (
		e: React.DragEvent<HTMLDivElement | HTMLLabelElement | HTMLFieldSetElement>,
	) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(true);
	};

	const handleDragLeave = (
		e: React.DragEvent<HTMLDivElement | HTMLLabelElement | HTMLFieldSetElement>,
	) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);
	};

	const handleDrop = useCallback(
		(
			e: React.DragEvent<
				HTMLDivElement | HTMLLabelElement | HTMLFieldSetElement
			>,
		) => {
			e.preventDefault();
			e.stopPropagation();
			setIsDragging(false);

			const file = e.dataTransfer.files?.[0];
			if (file) {
				validateAndUploadFile(file);
			}
		},
		[validateAndUploadFile],
	);

	const handleRemoveImage = async (index: number) => {
		const imageToRemove = imageList[index];

		// Mark image for deletion
		setDeletedImages((prev) => [...prev, imageToRemove]);

		// Remove from list
		const newImages = imageList.filter((_, i) => i !== index);
		const newImagesString = newImages.join(", ");

		// Update local state immediately for instant preview
		setImageList(newImages);
		// Update parent with new list and deleted images
		onImagesChange(newImagesString, [...deletedImages, imageToRemove]);
		toast.info("Image will be deleted when you save");
	};

	const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		onImagesChange(e.target.value);
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		if (over && active.id !== over.id) {
			const oldIndex = imageList.indexOf(active.id as string);
			const newIndex = imageList.indexOf(over.id as string);

			const newImages = arrayMove(imageList, oldIndex, newIndex);
			setImageList(newImages); // Update local state immediately for instant preview
			onImagesChange(newImages.join(", "));
		}
	};

	const handleUploadClick = () => {
		fileInputRef.current?.click();
	};

	return (
		<div className="space-y-2" ref={containerRef} data-image-upload-container>
			<div className="flex items-center justify-between">
				<label
					htmlFor={fileInputId}
					className="block text-sm font-medium"
					id={`${fileInputId}-label`}
				>
					Product Images {imageList.length > 0 && `(${imageList.length})`}
				</label>
				{imageList.length > 0 && (
					<Button
						type="button"
						onClick={() => setShowTextarea(!showTextarea)}
						variant="outline"
						size="sm"
					>
						{showTextarea ? "Hide" : "Edit"} Raw
					</Button>
				)}
			</div>

			{showTextarea ? (
				<Textarea
					value={currentImages}
					onChange={handleTextareaChange}
					placeholder="image1.jpg, image2.jpg, image3.jpg"
					className="h-32 resize-none font-mono text-xs"
					rows={4}
				/>
			) : (
				<section
					className="p-4 rounded-lg bg-muted/30 border border-border transition-colors image-upload-area"
					onDragOver={handleDragOver}
					onDragLeave={handleDragLeave}
					onDrop={handleDrop}
					onPaste={handleContainerPaste}
					aria-labelledby={`${fileInputId}-label`}
					style={{
						borderColor: isDragging ? "hsl(var(--primary))" : undefined,
					}}
				>
					<DndContext
						sensors={sensors}
						collisionDetection={closestCenter}
						onDragEnd={handleDragEnd}
					>
						<SortableContext items={imageList} strategy={rectSortingStrategy}>
							<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
								{imageList.map((image, index) => {
									return (
										<SortableImageItem
											key={image}
											image={image}
											index={index}
											onRemove={handleRemoveImage}
										/>
									);
								})}

								{/* Upload Button */}
								<button
									type="button"
									onClick={handleUploadClick}
									disabled={isUploading || isPasting}
									className="aspect-square rounded-lg border-2 border-dashed border-border/50 bg-background hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed group"
								>
									{isUploading || isPasting ? (
										<>
											<span className="animate-spin text-2xl">⏳</span>
											<span className="text-xs">
												{isPasting ? "Pasting..." : "Uploading..."}
											</span>
										</>
									) : (
										<>
											<Upload className="w-6 h-6 group-hover:scale-110 transition-transform" />
											<span className="text-xs text-center px-2">
												Drag and drop, select a file, or paste (Ctrl+V)
											</span>
										</>
									)}
								</button>
							</div>
						</SortableContext>
					</DndContext>

					<p className="text-xs text-muted-foreground mt-3 text-center">
						JPEG, PNG, WebP • Max 700KB • Paste images with Ctrl+V
					</p>
				</section>
			)}

			<input
				ref={fileInputRef}
				type="file"
				accept="image/jpeg,image/jpg,image/png,image/webp"
				id={fileInputId}
				onChange={handleFileChange}
				disabled={isUploading}
				className="hidden"
			/>
		</div>
	);
}
