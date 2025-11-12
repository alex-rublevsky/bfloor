import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useId, useState } from "react";
import { toast } from "sonner";
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
import { useSlugGeneration } from "~/hooks/useSlugGeneration";
import {
	brandsQueryOptions,
	categoriesQueryOptions,
	collectionsQueryOptions,
	storeLocationsQueryOptions,
} from "~/lib/queryOptions";
import { createProduct } from "~/server_functions/dashboard/store/createProduct";
import { moveStagingImages } from "~/server_functions/dashboard/store/moveStagingImages";
import type { ProductFormData } from "~/types";

interface Variation {
	id: string;
	sku: string;
	price: number;
	discount?: number | null;
	sort: number;
	attributeValues: Record<string, string>;
}

export const Route = createFileRoute("/dashboard/products/new")({
	component: NewProductPage,
});

function NewProductPage() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const { data: attributes } = useProductAttributes();
	const { data: categories } = useQuery(categoriesQueryOptions());
	const { data: brands } = useQuery(brandsQueryOptions());
	const { data: collections } = useQuery(collectionsQueryOptions());
	const { data: storeLocations } = useQuery(storeLocationsQueryOptions());

	// Generate unique IDs for form elements
	const createProductFormId = useId();

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

	const [formData, setFormData] = useState<ProductFormData>(defaultFormData);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState("");
	const [isAutoSlug, setIsAutoSlug] = useState(true);
	const [variations, setVariations] = useState<Variation[]>([]);
	const [selectedVariationAttributes, setSelectedVariationAttributes] =
		useState<string[]>([]);
	const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
	const [deletedImages, setDeletedImages] = useState<string[]>([]);
	const [selectedStoreLocationIds, setSelectedStoreLocationIds] = useState<
		number[]
	>([]);

	// Stable callbacks for slug generation
	const handleCreateSlugChange = useCallback(
		(slug: string) => setFormData((prev) => ({ ...prev, slug })),
		[],
	);

	// Auto-slug generation
	useSlugGeneration(formData.name, isAutoSlug, handleCreateSlugChange);

	// Sync variations to form data
	useEffect(() => {
		setFormData((prev) => ({
			...prev,
			variations: variations.map((v) => ({
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
	}, [variations]);

	const handleImagesChange = useCallback(
		(images: string, deletedImagesList?: string[]) => {
			setFormData((prev) => ({ ...prev, images }));
			if (deletedImagesList) {
				setDeletedImages(deletedImagesList);
			}
		},
		[],
	);

	const handleStoreLocationChange = useCallback(
		(locationId: number, checked: boolean) => {
			setSelectedStoreLocationIds((prev) => {
				if (checked) {
					return [...prev, locationId];
				} else {
					return prev.filter((id) => id !== locationId);
				}
			});
		},
		[],
	);

	const handleVariationsChange = useCallback((newVariations: Variation[]) => {
		setVariations(newVariations);
	}, []);

	const handleChange = useCallback(
		(
			e: React.ChangeEvent<
				HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
			>,
		) => {
			const { name, value, type } = e.target;
			const checked = (e.target as HTMLInputElement).checked;

			let updatedFormData: ProductFormData = { ...formData };

			if (name === "slug") {
				setIsAutoSlug(false);
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

			if (name === "hasVariations" && checked && variations.length === 0) {
				const defaultVariation: Variation = {
					id: `temp-${Date.now()}`,
					sku: generateVariationSKU(updatedFormData.slug, [], attributes || []),
					price: updatedFormData.price ? parseFloat(updatedFormData.price) : 0,
					sort: 0,
					attributeValues: {},
				};
				setVariations([defaultVariation]);
			}

			setFormData(updatedFormData);
		},
		[formData, variations, attributes],
	);

	const handleEntityCreated = useCallback(() => {
		queryClient.invalidateQueries({ queryKey: ["bfloorBrands"] });
		queryClient.invalidateQueries({ queryKey: ["bfloorCollections"] });
		queryClient.invalidateQueries({ queryKey: ["bfloorCategories"] });
	}, [queryClient]);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setHasAttemptedSubmit(true);

		// Validate required fields
		if (
			!formData.name ||
			!formData.slug ||
			!formData.price ||
			!formData.categorySlug
		) {
			return;
		}

		setIsSubmitting(true);
		setError("");

		try {
			// Parse images to identify staging images
			const images = formData.images
				? formData.images
						.split(",")
						.map((img) => img.trim())
						.filter(Boolean)
				: [];
			const stagingImages = images.filter((img) => img.startsWith("staging/"));

			// Move staging images to final location before creating product
			let finalImagePaths = images;
			if (stagingImages.length > 0) {
				try {
					const moveResult = await moveStagingImages({
						data: {
							imagePaths: stagingImages,
							finalFolder: "products",
							categorySlug: formData.categorySlug,
							productName: formData.name,
							slug: formData.slug,
						},
					});

					if (moveResult?.movedImages && moveResult?.pathMap) {
						finalImagePaths = images.map(
							(img) => moveResult.pathMap?.[img] || img,
						);
					} else if (
						moveResult?.movedImages &&
						moveResult.movedImages.length > 0
					) {
						finalImagePaths = images.map((img) => {
							const stagingIndex = stagingImages.indexOf(img);
							if (
								stagingIndex >= 0 &&
								stagingIndex < moveResult.movedImages.length
							) {
								return moveResult.movedImages[stagingIndex] || img;
							}
							return img;
						});
					}
				} catch (moveError) {
					console.error("Failed to move staging images:", moveError);
					toast.warning(
						"Изображения загружены, но не перемещены. Они будут очищены автоматически.",
					);
				}
			}

			const formattedVariations = variations.map((variation: Variation) => ({
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
			}));

			const submissionData = {
				...formData,
				images: finalImagePaths.join(", "),
				variations: formattedVariations,
				storeLocationIds: selectedStoreLocationIds,
			};

			await createProduct({ data: submissionData });

			toast.success("Product created successfully!");

			// Navigate back to dashboard
			navigate({ to: "/dashboard" });

			// Invalidate caches
			queryClient.invalidateQueries({
				queryKey: ["bfloorDashboardProductsInfinite"],
			});
			queryClient.removeQueries({
				queryKey: ["bfloorStoreDataInfinite"],
			});
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "An error occurred";
			setError(errorMessage);
			toast.error(errorMessage);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="container mx-auto py-8 px-4">
			<div className="mb-6">
				<Link
					to="/dashboard"
					className="text-muted-foreground hover:text-foreground"
				>
					← Back to Products
				</Link>
			</div>

			<h1 className="text-3xl font-bold mb-8">Создать новый товар</h1>

			<form
				onSubmit={handleSubmit}
				id={createProductFormId}
				className="space-y-6"
			>
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{/* Left Column - Images, Tags, Store Locations */}
					<div className="space-y-4 flex flex-col">
						{/* Product Images Block */}
						<DrawerSection variant="default">
							<ImageUpload
								currentImages={formData.images}
								onImagesChange={handleImagesChange}
								slug={formData.slug}
								categorySlug={formData.categorySlug}
								productName={formData.name}
							/>
						</DrawerSection>

						{/* Tags Block */}
						<DrawerSection variant="default" title="Теги">
							<CheckboxList
								items={PRODUCT_TAGS.map((tag) => ({
									id: tag,
									label: getProductTagName(tag),
								}))}
								selectedIds={formData.tags || []}
								onItemChange={(itemId, checked) => {
									const currentTags = formData.tags || [];
									if (checked) {
										setFormData({
											...formData,
											tags: [...currentTags, itemId as string],
										});
									} else {
										setFormData({
											...formData,
											tags: currentTags.filter((t) => t !== itemId),
										});
									}
								}}
								idPrefix="create-tag"
								columns={2}
							/>
						</DrawerSection>

						{/* Store Locations Block */}
						<DrawerSection variant="default" title="Местоположения магазинов">
							<StoreLocationsSelector
								storeLocations={storeLocations || []}
								selectedLocationIds={selectedStoreLocationIds}
								onLocationChange={handleStoreLocationChange}
								idPrefix="create"
							/>
						</DrawerSection>

						{/* Description Field */}
						<DrawerSection variant="default" title="Описание">
							<EnhancedDescriptionField
								name="description"
								value={formData.description || ""}
								onChange={handleChange}
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
								formData={formData}
								onChange={handleChange}
								isAutoSlug={isAutoSlug}
								onSlugChange={(slug) => {
									setIsAutoSlug(false);
									setFormData((prev) => ({ ...prev, slug }));
								}}
								onAutoSlugChange={setIsAutoSlug}
								hasAttemptedSubmit={hasAttemptedSubmit}
								idPrefix="create"
								categories={categories}
								brands={brands}
								collections={collections}
								onEntityCreated={handleEntityCreated}
							/>
						</DrawerSection>

						<DrawerSection variant="default" title="Важная заметка">
							<EnhancedDescriptionField
								name="importantNote"
								value={formData.importantNote || ""}
								onChange={handleChange}
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
						attributes={formData.attributes || []}
						onChange={(attributes) => setFormData({ ...formData, attributes })}
					/>
				</DrawerSection>

				{/* Variations Block */}
				{formData.hasVariations && (
					<>
						<DrawerSection variant="default" className="lg:col-span-2">
							<ProductVariationAttributesSelector
								selectedAttributes={selectedVariationAttributes}
								onChange={setSelectedVariationAttributes}
							/>
						</DrawerSection>

						<DrawerSection variant="default" className="lg:col-span-2">
							<ProductVariationForm
								variations={variations}
								productSlug={formData.slug}
								selectedAttributes={selectedVariationAttributes}
								onChange={handleVariationsChange}
							/>
						</DrawerSection>
					</>
				)}

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
						{isSubmitting ? "Создание..." : "Создать товар"}
					</Button>
				</div>

				{error && <div className="text-destructive text-sm mt-4">{error}</div>}
			</form>
		</div>
	);
}
