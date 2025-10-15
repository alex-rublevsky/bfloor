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
import { useEffect, useRef, useState } from "react";
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
					title="Drag to reorder"
				>
					<GripVertical className="w-3 h-3" />
				</button>
				{/* Delete Button */}
				<button
					type="button"
					onClick={() => onRemove(index)}
					className="absolute top-1 right-1 p-1.5 bg-destructive text-destructive-foreground rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90 cursor-pointer"
					title="Remove image"
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
}: ImageUploadProps) {
	const [isUploading, setIsUploading] = useState(false);
	const [imageList, setImageList] = useState<string[]>([]);
	const [showTextarea, setShowTextarea] = useState(false);
	const [deletedImages, setDeletedImages] = useState<string[]>([]);
	const [isDragging, setIsDragging] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const fileInputId =
		typeof crypto !== "undefined" && crypto.randomUUID
			? crypto.randomUUID()
			: `file-input-${Date.now()}`;

	// Drag and drop sensors
	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor),
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

	const validateAndUploadFile = async (file: File) => {
		// Validate file type
		const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
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
			// Convert file to base64
			const reader = new FileReader();
			reader.onloadend = async () => {
				try {
					const base64String = reader.result as string;

					const result = await uploadProductImage({
						data: {
							fileData: base64String,
							fileName: file.name,
							fileType: file.type,
							fileSize: file.size,
							folder,
							slug,
						},
					});

					if (result.success) {
						toast.success("Image uploaded successfully!");
						// Add new image to the list
						const newImages = [...imageList, result.filename];
						onImagesChange(newImages.join(", "));
						// Reset the form
						if (fileInputRef.current) {
							fileInputRef.current.value = "";
						}
					}
				} catch (error) {
					console.error("Upload error:", error);
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

			reader.readAsDataURL(file);
		} catch (error) {
			console.error("Upload error:", error);
			toast.error(
				error instanceof Error ? error.message : "Failed to upload image",
			);
			setIsUploading(false);
		}
	};

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;
		validateAndUploadFile(file);
	};

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

	const handleDrop = (
		e: React.DragEvent<HTMLDivElement | HTMLLabelElement | HTMLFieldSetElement>,
	) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);

		const file = e.dataTransfer.files?.[0];
		if (file) {
			validateAndUploadFile(file);
		}
	};

	const handleRemoveImage = async (index: number) => {
		const imageToRemove = imageList[index];

		// Mark image for deletion
		setDeletedImages((prev) => [...prev, imageToRemove]);

		// Remove from list
		const newImages = imageList.filter((_, i) => i !== index);
		const newImagesString = newImages.join(", ");

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
			onImagesChange(newImages.join(", "));
		}
	};

	const handleUploadClick = () => {
		fileInputRef.current?.click();
	};

	return (
		<div className="space-y-2">
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
				<fieldset
					className="p-4 rounded-lg bg-muted/30 border border-border transition-colors"
					onDragOver={handleDragOver}
					onDragLeave={handleDragLeave}
					onDrop={handleDrop}
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
								{imageList.map((image, index) => (
									<SortableImageItem
										key={image}
										image={image}
										index={index}
										onRemove={handleRemoveImage}
									/>
								))}

								{/* Upload Button */}
								<button
									type="button"
									onClick={handleUploadClick}
									disabled={isUploading}
									className="aspect-square rounded-lg border-2 border-dashed border-border/50 bg-background hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed group"
								>
									{isUploading ? (
										<>
											<span className="animate-spin text-2xl">⏳</span>
											<span className="text-xs">Uploading...</span>
										</>
									) : (
										<>
											<Upload className="w-6 h-6 group-hover:scale-110 transition-transform" />
											<span className="text-xs text-center px-2">
												Drag and drop or select a file
											</span>
										</>
									)}
								</button>
							</div>
						</SortableContext>
					</DndContext>

					<p className="text-xs text-muted-foreground mt-3 text-center">
						JPEG, PNG, WebP • Max 5MB
					</p>
				</fieldset>
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
