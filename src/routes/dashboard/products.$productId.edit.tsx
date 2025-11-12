import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { useCallback, useEffect, useId, useState } from "react";
import { toast } from "sonner";
import DeleteConfirmationDialog from "~/components/ui/dashboard/ConfirmationDialog";
import { EnhancedDescriptionField } from "~/components/ui/dashboard/EnhancedDescriptionField";
import { ImageUpload } from "~/components/ui/dashboard/ImageUpload";
import ProductAttributesForm from "~/components/ui/dashboard/ProductAttributesForm";
import { ProductBasicInfoFields } from "~/components/ui/dashboard/ProductBasicInfoFields";
import { DrawerSection } from "~/components/ui/dashboard/ProductFormSection";
import ProductVariationAttributesSelector from "~/components/ui/dashboard/ProductVariationAttributesSelector";
import ProductVariationForm from "~/components/ui/dashboard/ProductVariationForm";
import { StoreLocationsSelector } from "~/components/ui/dashboard/StoreLocationsSelector";
import { Button } from "~/components/ui/shared/Button";
import { CheckboxList } from "~/components/ui/shared/CheckboxList";
import { getProductTagName, PRODUCT_TAGS } from "~/constants/units";
import {
	generateVariationSKU,
	useProductAttributes,
} from "~/hooks/useProductAttributes";
import { generateSlug, useSlugGeneration } from "~/hooks/useSlugGeneration";
import {
	brandsQueryOptions,
	categoriesQueryOptions,
	collectionsQueryOptions,
	storeLocationsQueryOptions,
} from "~/lib/queryOptions";
import { deleteProduct } from "~/server_functions/dashboard/store/deleteProduct";
import { deleteProductImage } from "~/server_functions/dashboard/store/deleteProductImage";
import { getProductBySlug } from "~/server_functions/dashboard/store/getProductBySlug";
import { moveStagingImages } from "~/server_functions/dashboard/store/moveStagingImages";
import { updateProduct } from "~/server_functions/dashboard/store/updateProduct";
import type {
	ProductAttributeFormData,
	ProductFormData,
	ProductVariationWithAttributes,
} from "~/types";

interface Variation {
	id: string;
	sku: string;
	price: number;
	discount?: number | null;
	sort: number;
	attributeValues: Record<string, string>;
}

export const Route = createFileRoute("/dashboard/products/$productId/edit")({
	component: EditProductPage,
});

function EditProductPage() {
	const { productId } = Route.useParams();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const productIdNum = parseInt(productId, 10);

	const { data: attributes } = useProductAttributes();
	const { data: categories } = useQuery(categoriesQueryOptions());
	const { data: brands } = useQuery(brandsQueryOptions());
	const { data: collections } = useQuery(collectionsQueryOptions());
	const { data: storeLocations } = useQuery(storeLocationsQueryOptions());

	// Generate unique IDs for form elements
	const editProductFormId = useId();

	const defaultFormData: ProductFormData = {
		name: "",
		slug: "",
		sku: "",
		description: "",
		importantNote: "",
		tags: [],
		price: "0",
		squareMetersPerPack: "",
		unitOfMeasurement: "штука",
		categorySlug: "",
		brandSlug: "",
		collectionSlug: "",
		isActive: true,
		isFeatured: false,
		discount: null,
		hasVariations: false,
		images: "",
		attributes: [],
		variations: [],
	};

	const [editFormData, setEditFormData] =
		useState<ProductFormData>(defaultFormData);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState("");
	const [isEditAutoSlug, setIsEditAutoSlug] = useState(false);
	const [originalProductSlug, setOriginalProductSlug] = useState<string>("");
	const [editVariations, setEditVariations] = useState<Variation[]>([]);
	const [editSelectedVariationAttributes, setEditSelectedVariationAttributes] =
		useState<string[]>([]);
	const [hasAttemptedEditSubmit, setHasAttemptedEditSubmit] = useState(false);
	const [editDeletedImages, setEditDeletedImages] = useState<string[]>([]);
	const [editSelectedStoreLocationIds, setEditSelectedStoreLocationIds] =
		useState<number[]>([]);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	// Load product data
	const { data: productWithDetails, isLoading } = useQuery({
		queryKey: ["bfloorDashboardProduct", productIdNum],
		queryFn: () => getProductBySlug({ data: { id: productIdNum } }),
		enabled: !!productIdNum,
	});

	// Stable callbacks for slug generation
	const handleEditSlugChange = useCallback(
		(slug: string) => setEditFormData((prev) => ({ ...prev, slug })),
		[],
	);

	// Auto-slug generation
	useSlugGeneration(editFormData.name, isEditAutoSlug, handleEditSlugChange);

	// Load product data into form
	useEffect(() => {
		if (!productWithDetails) return;

		// Convert variations to the new frontend format
		const formattedVariations =
			productWithDetails.variations?.map(
				(variation: ProductVariationWithAttributes) => {
					const attributeValues: Record<string, string> = {};
					variation.attributes?.forEach((attr) => {
						attributeValues[attr.attributeId] = attr.value;
					});

					return {
						id: variation.id.toString(),
						sku: variation.sku,
						price: variation.price,
						discount: variation.discount,
						sort: variation.sort ?? 0,
						attributeValues,
					};
				},
			) || [];

		const selectedAttributes = new Set<string>();
		formattedVariations.forEach((variation) => {
			Object.keys(variation.attributeValues).forEach((attrId) => {
				selectedAttributes.add(attrId);
			});
		});

		const isCustomSlug =
			productWithDetails.slug !== generateSlug(productWithDetails.name);

		let imagesString = "";
		if (productWithDetails.images) {
			try {
				const imagesArray = JSON.parse(productWithDetails.images) as string[];
				imagesString = imagesArray.join(", ");
			} catch {
				if (typeof productWithDetails.images === "string") {
					if (
						productWithDetails.images.startsWith("[") &&
						productWithDetails.images.endsWith("]")
					) {
						const matches = productWithDetails.images.match(/"([^"]+)"/g);
						if (matches) {
							const filenames = matches.map((match) => match.replace(/"/g, ""));
							imagesString = filenames.join(", ");
						}
					} else {
						imagesString = productWithDetails.images;
					}
				}
			}
		}

		let parsedAttributes: ProductAttributeFormData[] = [];
		if (productWithDetails.productAttributes) {
			if (Array.isArray(productWithDetails.productAttributes)) {
				parsedAttributes = productWithDetails.productAttributes;
			} else if (typeof productWithDetails.productAttributes === "string") {
				try {
					const parsed = JSON.parse(productWithDetails.productAttributes);
					parsedAttributes = Array.isArray(parsed) ? parsed : [];
				} catch {
					parsedAttributes = [];
				}
			}
		}

		let parsedTags: string[] = [];
		if (productWithDetails.tags) {
			try {
				parsedTags = JSON.parse(productWithDetails.tags) as string[];
			} catch {
				parsedTags = [];
			}
		}

		setEditFormData({
			name: productWithDetails.name,
			slug: productWithDetails.slug,
			sku: productWithDetails.sku || "",
			description: productWithDetails.description || "",
			importantNote: productWithDetails.importantNote || "",
			tags: parsedTags,
			price: productWithDetails.price.toString(),
			squareMetersPerPack:
				productWithDetails.squareMetersPerPack?.toString() || "",
			unitOfMeasurement: productWithDetails.unitOfMeasurement || "штука",
			categorySlug: productWithDetails.categorySlug || "",
			brandSlug: productWithDetails.brandSlug || "",
			collectionSlug: productWithDetails.collectionSlug || "",
			isActive: productWithDetails.isActive,
			isFeatured: productWithDetails.isFeatured,
			discount: productWithDetails.discount,
			hasVariations: productWithDetails.hasVariations,
			images: imagesString,
			attributes: parsedAttributes,
			variations: [],
		});

		setOriginalProductSlug(productWithDetails.slug);

		const storeLocationIds = (productWithDetails.storeLocationIds || []).filter(
			(id): id is number => id !== null,
		);
		setEditSelectedStoreLocationIds(storeLocationIds);

		setIsEditAutoSlug(!isCustomSlug);
		setEditVariations(formattedVariations);
		setEditSelectedVariationAttributes(Array.from(selectedAttributes));
	}, [productWithDetails]);

	// Sync variations to form data
	useEffect(() => {
		setEditFormData((prev) => ({
			...prev,
			variations: editVariations.map((v) => ({
				id: v.id.startsWith("temp-") ? undefined : parseInt(v.id, 10),
				sku: v.sku,
				price: v.price.toString(),
				sort: v.sort,
				attributes: Object.entries(v.attributeValues).map(
					([attributeId, value]) => ({
						attributeId,
						value,
					}),
				),
			})),
		}));
	}, [editVariations]);

	const handleEditImagesChange = useCallback(
		(images: string, deletedImagesList?: string[]) => {
			setEditFormData((prev) => ({ ...prev, images }));
			if (deletedImagesList) {
				setEditDeletedImages(deletedImagesList);
			}
		},
		[],
	);

	const handleEditStoreLocationChange = useCallback(
		(locationId: number, checked: boolean) => {
			setEditSelectedStoreLocationIds((prev) => {
				if (checked) {
					return [...prev, locationId];
				} else {
					return prev.filter((id) => id !== locationId);
				}
			});
		},
		[],
	);

	const handleEditVariationsChange = useCallback(
		(newVariations: Variation[]) => {
			setEditVariations(newVariations);
		},
		[],
	);

	const handleEditChange = useCallback(
		(
			e: React.ChangeEvent<
				HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
			>,
		) => {
			const { name, value, type } = e.target;
			const checked = (e.target as HTMLInputElement).checked;

			let updatedFormData: ProductFormData = { ...editFormData };

			if (name === "slug") {
				setIsEditAutoSlug(false);
			}

			if (name === "discount") {
				updatedFormData = {
					...updatedFormData,
					discount: value === "" ? null : parseInt(value, 10) || null,
				};
			} else {
				updatedFormData = {
					...updatedFormData,
					[name]: type === "checkbox" ? checked : value,
				};
			}

			if (name === "hasVariations" && checked && editVariations.length === 0) {
				const defaultVariation: Variation = {
					id: `temp-${Date.now()}`,
					sku: generateVariationSKU(updatedFormData.slug, [], attributes || []),
					price: updatedFormData.price ? parseFloat(updatedFormData.price) : 0,
					sort: 0,
					attributeValues: {},
				};
				setEditVariations([defaultVariation]);
			}

			setEditFormData(updatedFormData);
		},
		[editFormData, editVariations, attributes],
	);

	const handleEntityCreated = useCallback(() => {
		queryClient.invalidateQueries({ queryKey: ["bfloorBrands"] });
		queryClient.invalidateQueries({ queryKey: ["bfloorCollections"] });
		queryClient.invalidateQueries({ queryKey: ["bfloorCategories"] });
	}, [queryClient]);

	const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setHasAttemptedEditSubmit(true);

		if (!editFormData.name || !editFormData.slug || !editFormData.price) {
			return;
		}

		setIsSubmitting(true);
		setError("");

		try {
			// Handle image deletion and staging image movement (same logic as create)
			const images = editFormData.images
				? editFormData.images
						.split(",")
						.map((img) => img.trim())
						.filter(Boolean)
				: [];
			const stagingImages = images.filter((img) => img.startsWith("staging/"));

			let finalImagePaths = images;
			if (stagingImages.length > 0) {
				try {
					const moveResult = await moveStagingImages({
						data: {
							imagePaths: stagingImages,
							finalFolder: "products",
							categorySlug: editFormData.categorySlug,
							productName: editFormData.name,
							slug: editFormData.slug,
						},
					});

					if (moveResult?.movedImages && moveResult?.pathMap) {
						finalImagePaths = images.map(
							(img) => moveResult.pathMap?.[img] || img,
						);
					}
				} catch (moveError) {
					console.error("Failed to move staging images:", moveError);
					toast.warning(
						"Изображения загружены, но не перемещены. Они будут очищены автоматически.",
					);
				}
			}

			// Delete removed images
			if (editDeletedImages.length > 0) {
				const deletePromises = editDeletedImages.map((filename) =>
					deleteProductImage({ data: { filename } }).catch((error) => {
						console.error(`Failed to delete ${filename}:`, error);
					}),
				);
				await Promise.all(deletePromises);
			}

			const formattedVariations = editVariations.map(
				(variation: Variation) => ({
					id: variation.id.startsWith("temp-")
						? undefined
						: parseInt(variation.id, 10),
					sku: variation.sku,
					price: variation.price.toString(),
					sort: variation.sort,
					attributes: Object.entries(variation.attributeValues).map(
						([attributeId, value]) => ({
							attributeId,
							value,
						}),
					),
				}),
			);

			const submissionData = {
				...editFormData,
				images: finalImagePaths.join(", "),
				variations: formattedVariations,
				storeLocationIds: editSelectedStoreLocationIds,
			};

			await updateProduct({
				data: { id: productIdNum, data: submissionData },
			});

			toast.success("Product updated successfully!");

			// Navigate back to dashboard
			navigate({ to: "/dashboard" });

			// Invalidate caches
			queryClient.invalidateQueries({
				queryKey: ["bfloorDashboardProductsInfinite"],
			});
			queryClient.invalidateQueries({
				queryKey: ["bfloorDashboardProduct", productIdNum],
			});
			queryClient.removeQueries({
				queryKey: ["bfloorStoreDataInfinite"],
			});
			if (originalProductSlug !== editFormData.slug) {
				queryClient.removeQueries({
					queryKey: ["bfloorProduct", originalProductSlug],
				});
				queryClient.removeQueries({
					queryKey: ["bfloorProduct", editFormData.slug],
				});
			}
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "An error occurred";
			setError(errorMessage);
			toast.error(errorMessage);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteClick = useCallback(() => {
		setShowDeleteDialog(true);
	}, []);

	const handleDeleteConfirm = async () => {
		setIsDeleting(true);
		setError("");

		try {
			await deleteProduct({ data: { id: productIdNum } });
			toast.success("Product deleted successfully!");
			navigate({ to: "/dashboard" });
			queryClient.invalidateQueries({
				queryKey: ["bfloorDashboardProductsInfinite"],
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
			toast.error(err instanceof Error ? err.message : "An error occurred");
		} finally {
			setIsDeleting(false);
		}
	};

	const handleDeleteCancel = () => {
		setShowDeleteDialog(false);
	};

	if (isLoading) {
		return <div>Loading...</div>;
	}

	if (!productWithDetails) {
		return <div>Product not found</div>;
	}

	return (
		<div className="container mx-auto py-8 px-4">
			<div className="mb-6">
				<Link
					to="/dashboard"
					className="text-muted-foreground hover:text-foreground"
				>
					← Назад
				</Link>
			</div>

			<h1 className="text-3xl font-bold mb-8">Редактировать товар</h1>

			<form
				onSubmit={handleUpdate}
				id={editProductFormId}
				className="space-y-6"
			>
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{/* Left Column - Images, Tags, Store Locations */}
					<div className="space-y-4 flex flex-col">
						{/* Product Images Block */}
						<DrawerSection variant="default">
							<ImageUpload
								currentImages={editFormData.images}
								onImagesChange={handleEditImagesChange}
								slug={editFormData.slug}
								categorySlug={editFormData.categorySlug}
								productName={editFormData.name}
								productId={productIdNum}
							/>
						</DrawerSection>

						{/* Tags Block */}
						<DrawerSection variant="default" title="Теги">
							<CheckboxList
								items={PRODUCT_TAGS.map((tag) => ({
									id: tag,
									label: getProductTagName(tag),
								}))}
								selectedIds={editFormData.tags || []}
								onItemChange={(itemId, checked) => {
									const currentTags = editFormData.tags || [];
									if (checked) {
										setEditFormData({
											...editFormData,
											tags: [...currentTags, itemId as string],
										});
									} else {
										setEditFormData({
											...editFormData,
											tags: currentTags.filter((t) => t !== itemId),
										});
									}
								}}
								idPrefix="edit-tag"
								columns={2}
							/>
						</DrawerSection>

						{/* Store Locations Block */}
						<DrawerSection variant="default" title="Местоположения магазинов">
							<StoreLocationsSelector
								storeLocations={storeLocations || []}
								selectedLocationIds={editSelectedStoreLocationIds}
								onLocationChange={handleEditStoreLocationChange}
								idPrefix="edit"
							/>
						</DrawerSection>

						{/* Description Field */}
						<DrawerSection variant="default" title="Описание">
							<EnhancedDescriptionField
								name="description"
								value={editFormData.description || ""}
								onChange={handleEditChange}
								placeholder="Добавьте описание товара..."
								className="min-h-[4rem]"
								showPreview={true}
								showHelp={true}
								autoClean={false}
								label=""
							/>
						</DrawerSection>
					</div>

					{/* Right Column - Basic Information */}
					<div className="space-y-4 flex flex-col">
						{/* Basic Info */}
						<DrawerSection variant="default" title="Базовая информация">
							<ProductBasicInfoFields
								formData={editFormData}
								onChange={handleEditChange}
								isAutoSlug={isEditAutoSlug}
								onSlugChange={(slug) => {
									setIsEditAutoSlug(false);
									setEditFormData((prev) => ({ ...prev, slug }));
								}}
								onAutoSlugChange={(isAuto) => {
									setIsEditAutoSlug(isAuto);
									if (isAuto && editFormData.name) {
										const generated = generateSlug(editFormData.name);
										setEditFormData((prev) => ({ ...prev, slug: generated }));
									}
								}}
								hasAttemptedSubmit={hasAttemptedEditSubmit}
								idPrefix="edit"
								categories={categories?.map((c) => ({ ...c, count: 0 }))}
								brands={brands}
								collections={collections}
								onEntityCreated={handleEntityCreated}
								productId={productIdNum}
							/>
						</DrawerSection>

						<DrawerSection variant="default" title="Важная заметка">
							<EnhancedDescriptionField
								name="importantNote"
								value={editFormData.importantNote || ""}
								onChange={handleEditChange}
								placeholder="Добавьте важную заметку с поддержкой Markdown..."
								className="min-h-[4rem]"
								label=""
								showPreview={true}
								showHelp={true}
							/>
						</DrawerSection>
					</div>
				</div>

				{/* Product Attributes Block */}
				<DrawerSection variant="default" className="lg:col-span-2">
					<ProductAttributesForm
						attributes={editFormData.attributes || []}
						onChange={(attributes) =>
							setEditFormData({ ...editFormData, attributes })
						}
					/>
				</DrawerSection>

				{/* Variations Block */}
				{editFormData.hasVariations && (
					<>
						<DrawerSection variant="default" className="lg:col-span-2">
							<ProductVariationAttributesSelector
								selectedAttributes={editSelectedVariationAttributes}
								onChange={setEditSelectedVariationAttributes}
							/>
						</DrawerSection>

						<DrawerSection variant="default" className="lg:col-span-2">
							<ProductVariationForm
								variations={editVariations}
								productSlug={editFormData.slug}
								selectedAttributes={editSelectedVariationAttributes}
								onChange={handleEditVariationsChange}
							/>
						</DrawerSection>
					</>
				)}

				{/* Delete Product Section */}
				<DrawerSection variant="default" className="lg:col-span-2">
					<div className="flex flex-col gap-2">
						<h3 className="text-sm font-medium text-destructive">
							Опасная зона
						</h3>
						<p className="text-sm text-muted-foreground">
							Удаление товара является необратимым действием. Все данные о
							товаре будут безвозвратно удалены.
						</p>
						<Button
							type="button"
							variant="destructive"
							onClick={handleDeleteClick}
							className="mt-2 w-fit"
						>
							<Trash2 className="w-4 h-4" />
							<span>Удалить товар</span>
						</Button>
					</div>
				</DrawerSection>

				{/* Submit Button */}
				<div className="flex justify-end gap-4">
					<Button
						type="button"
						variant="outline"
						onClick={() => navigate({ to: "/dashboard" })}
					>
						Отмена
					</Button>
					<Button type="submit" disabled={isSubmitting}>
						{isSubmitting ? "Обновление..." : "Обновить товар"}
					</Button>
				</div>

				{error && <div className="text-destructive text-sm mt-4">{error}</div>}
			</form>

			<DeleteConfirmationDialog
				isOpen={showDeleteDialog}
				onClose={handleDeleteCancel}
				onConfirm={handleDeleteConfirm}
				title="Удалить товар?"
				description="Это действие нельзя отменить. Товар будет удален навсегда."
				isDeleting={isDeleting}
			/>
		</div>
	);
}
