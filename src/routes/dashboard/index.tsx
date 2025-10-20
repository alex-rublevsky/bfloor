import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useId, useState } from "react";
import { toast } from "sonner";
import { AdminProductCard } from "~/components/ui/dashboard/AdminProductCard";
import DeleteConfirmationDialog from "~/components/ui/dashboard/ConfirmationDialog";
import { DashboardFormDrawer } from "~/components/ui/dashboard/DashboardFormDrawer";
import { DescriptionField } from "~/components/ui/dashboard/DescriptionField";
import { ImageUpload } from "~/components/ui/dashboard/ImageUpload";
import ProductAttributesForm from "~/components/ui/dashboard/ProductAttributesForm";
import { DrawerSection } from "~/components/ui/dashboard/ProductFormSection";
import { ProductSettingsFields } from "~/components/ui/dashboard/ProductSettingsFields";
import ProductVariationAttributesSelector from "~/components/ui/dashboard/ProductVariationAttributesSelector";
import ProductVariationForm from "~/components/ui/dashboard/ProductVariationForm";
import { SelectWithCreate } from "~/components/ui/dashboard/SelectWithCreate";
import { SlugField } from "~/components/ui/dashboard/SlugField";
import { StoreLocationsSelector } from "~/components/ui/dashboard/StoreLocationsSelector";
import { ProductsPageSkeleton } from "~/components/ui/dashboard/skeletons/ProductsPageSkeleton";
import { CheckboxList } from "~/components/ui/shared/CheckboxList";
import { EmptyState } from "~/components/ui/shared/EmptyState";
import { Input } from "~/components/ui/shared/input";
import {
	getProductTagName,
	PRODUCT_TAGS,
	UNITS_OF_MEASUREMENT,
} from "~/constants/units";
import {
	generateVariationSKU,
	useProductAttributes,
} from "~/hooks/useProductAttributes";
import { generateSlug, useSlugGeneration } from "~/hooks/useSlugGeneration";
import { useDashboardSearch } from "~/lib/dashboardSearchContext";
import { storeDataQueryOptions } from "~/lib/queryOptions";
import { cn } from "~/lib/utils";
import { createProduct } from "~/server_functions/dashboard/store/createProduct";
import { deleteProduct } from "~/server_functions/dashboard/store/deleteProduct";
import { deleteProductImage } from "~/server_functions/dashboard/store/deleteProductImage";
import { getAllProducts } from "~/server_functions/dashboard/store/getAllProducts";
import { getProductBySlug } from "~/server_functions/dashboard/store/getProductBySlug";
import {
	getProductStoreLocations,
	updateProductStoreLocations,
} from "~/server_functions/dashboard/store/productStoreLocations";
import { updateProduct } from "~/server_functions/dashboard/store/updateProduct";
import { getAllStoreLocations } from "~/server_functions/dashboard/storeLocations/getAllStoreLocations";
import type {
	ProductAttributeFormData,
	ProductFormData,
	ProductVariationWithAttributes,
	ProductWithVariations,
} from "~/types";

interface Variation {
	id: string;
	sku: string;
	price: number;
	stock: number;
	discount?: number | null;
	sort: number;
	attributeValues: Record<string, string>; // attributeId -> value mapping
}

// Query options factory for reuse
const productsQueryOptions = () => ({
	queryKey: ["bfloorDashboardProducts"],
	queryFn: () => getAllProducts(),
	staleTime: 0, // No cache - force fresh data
});

export const Route = createFileRoute("/dashboard/")({
	component: RouteComponent,
	pendingComponent: ProductsPageSkeleton,

	// Loader prefetches data before component renders
	loader: async ({ context: { queryClient } }) => {
		// Ensure data is loaded before component renders
		await queryClient.ensureQueryData(productsQueryOptions());
	},
});

function RouteComponent() {
	const queryClient = useQueryClient();
	const { searchTerm } = useDashboardSearch();

	// Use suspense query - data is guaranteed to be loaded by the loader
	const { data: productsData } = useSuspenseQuery(productsQueryOptions());

	// Store locations query
	const { data: storeLocations } = useSuspenseQuery({
		queryKey: ["bfloorDashboardStoreLocations"],
		queryFn: () => getAllStoreLocations(),
		staleTime: 1000 * 60 * 5,
	});

	// Product attributes query
	const { data: attributes } = useProductAttributes();

	// Function to refetch data using query invalidation
	const refetch = () => {
		// Invalidate dashboard products cache
		queryClient.invalidateQueries({
			queryKey: ["bfloorDashboardProducts"],
		});

		// Remove store data cache completely - forces fresh fetch on all clients
		queryClient.removeQueries({
			queryKey: storeDataQueryOptions().queryKey,
		});
	};

	// Function to invalidate specific product cache (for updates)
	const invalidateProductCache = (
		_productId: number,
		oldSlug?: string,
		newSlug?: string,
	) => {
		// Remove store data cache completely - forces fresh fetch on all clients
		queryClient.removeQueries({
			queryKey: storeDataQueryOptions().queryKey,
		});

		// If slug changed, remove both old and new product pages
		if (oldSlug && newSlug && oldSlug !== newSlug) {
			queryClient.removeQueries({
				queryKey: ["bfloorProduct", oldSlug],
			});
			queryClient.removeQueries({
				queryKey: ["bfloorProduct", newSlug],
			});
		} else if (newSlug) {
			// If only new slug available, remove that product page
			queryClient.removeQueries({
				queryKey: ["bfloorProduct", newSlug],
			});
		}
		// If no slug info, don't remove individual product pages
		// (they'll get fresh data from storeData when accessed)
	};

	// Generate unique IDs for form elements
	const editStockId = useId();
	const editCategoryId = useId();
	const editBrandId = useId();
	const editCollectionId = useId();
	const editUnitId = useId();

	const addPriceId = useId();
	const addCategoryId = useId();
	const addBrandId = useId();
	const addCollectionId = useId();
	const createUnitId = useId();
	const editProductFormId = useId();
	const createProductFormId = useId();
	const editPriceId = useId();

	const defaultFormData = {
		name: "",
		slug: "",
		description: "",
		importantNote: "",
		tags: [],
		price: "0",
		squareMetersPerPack: "",
		unitOfMeasurement: "штука",
		categorySlug: "",
		brandSlug: "",
		collectionSlug: "",
		stock: "0",
		isActive: true,
		isFeatured: false,
		discount: null,
		hasVariations: false,
		images: "",
		attributes: [],
		variations: [],
	};

	// All state hooks at the top level
	const [formData, setFormData] = useState<ProductFormData>(defaultFormData);
	const [editFormData, setEditFormData] =
		useState<ProductFormData>(defaultFormData);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState("");
	const [isAutoSlug, setIsAutoSlug] = useState(true);
	const [isEditAutoSlug, setIsEditAutoSlug] = useState(false);
	const [isEditMode, setIsEditMode] = useState(false);
	const [editingProductId, setEditingProductId] = useState<number | null>(null);
	const [originalProductSlug, setOriginalProductSlug] = useState<string>("");
	const [showEditModal, setShowEditModal] = useState(false);
	const [variations, setVariations] = useState<Variation[]>([]);
	const [editVariations, setEditVariations] = useState<Variation[]>([]);
	const [selectedVariationAttributes, setSelectedVariationAttributes] =
		useState<string[]>([]);
	const [editSelectedVariationAttributes, setEditSelectedVariationAttributes] =
		useState<string[]>([]);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [deletingProductId, setDeletingProductId] = useState<number | null>(
		null,
	);
	const [isDeleting, setIsDeleting] = useState(false);
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
	const [_deletedImages, setDeletedImages] = useState<string[]>([]);
	const [editDeletedImages, setEditDeletedImages] = useState<string[]>([]);

	// Store locations state
	const [selectedStoreLocationIds, setSelectedStoreLocationIds] = useState<
		number[]
	>([]);
	const [editSelectedStoreLocationIds, setEditSelectedStoreLocationIds] =
		useState<number[]>([]);

	// Stable callbacks for slug generation
	const handleCreateSlugChange = useCallback(
		(slug: string) => setFormData((prev) => ({ ...prev, slug })),
		[],
	);

	const handleEditSlugChange = useCallback(
		(slug: string) => setEditFormData((prev) => ({ ...prev, slug })),
		[],
	);

	// Auto-slug generation hooks
	useSlugGeneration(formData.name, isAutoSlug, handleCreateSlugChange);
	useSlugGeneration(editFormData.name, isEditAutoSlug, handleEditSlugChange);

	useEffect(() => {
		setFormData((prev) => ({
			...prev,
			variations: variations.map((v) => ({
				id: v.id.startsWith("temp-") ? undefined : parseInt(v.id, 10),
				sku: v.sku,
				price: v.price.toString(),
				stock: v.stock.toString(),
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

	useEffect(() => {
		setEditFormData((prev) => ({
			...prev,
			variations: editVariations.map((v) => ({
				id: v.id.startsWith("temp-") ? undefined : parseInt(v.id, 10),
				sku: v.sku,
				price: v.price.toString(),
				stock: v.stock.toString(),
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

	// Listen for action button clicks from navbar
	useEffect(() => {
		const handleAction = () => {
			setShowCreateForm(true);
		};

		window.addEventListener("dashboardAction", handleAction);
		return () => window.removeEventListener("dashboardAction", handleAction);
	}, []);

	// Event handlers and utility functions
	const handleVariationsChange = (newVariations: Variation[]) => {
		setVariations(newVariations);
	};

	const handleEditVariationsChange = (newVariations: Variation[]) => {
		setEditVariations(newVariations);
	};

	// Store location handlers
	const handleStoreLocationChange = (locationId: number, checked: boolean) => {
		setSelectedStoreLocationIds((prev) => {
			if (checked) {
				return [...prev, locationId];
			} else {
				return prev.filter((id) => id !== locationId);
			}
		});
	};

	const handleEditStoreLocationChange = (
		locationId: number,
		checked: boolean,
	) => {
		setEditSelectedStoreLocationIds((prev) => {
			if (checked) {
				return [...prev, locationId];
			} else {
				return prev.filter((id) => id !== locationId);
			}
		});
	};

	const handleImagesChange = (images: string, deletedImagesList?: string[]) => {
		setFormData((prev) => ({ ...prev, images }));
		if (deletedImagesList) {
			setDeletedImages(deletedImagesList);
		}
	};

	const handleEditImagesChange = (
		images: string,
		deletedImagesList?: string[],
	) => {
		setEditFormData((prev) => ({ ...prev, images }));
		if (deletedImagesList) {
			setEditDeletedImages(deletedImagesList);
		}
	};

	const closeCreateModal = () => {
		setShowCreateForm(false);
		setFormData(defaultFormData);
		setVariations([]);
		setDeletedImages([]);
		setSelectedStoreLocationIds([]);
		setIsAutoSlug(true);
		setHasAttemptedSubmit(false);
		setError("");
	};

	const closeEditModal = () => {
		setShowEditModal(false);
		setEditingProductId(null);
		setOriginalProductSlug(""); // Reset original slug
		setEditFormData(defaultFormData);
		setEditVariations([]);
		setEditSelectedStoreLocationIds([]);
		setEditDeletedImages([]);
		setIsEditAutoSlug(false);
		setError("");
	};

	const formatPrice = (price: number | string | null): string => {
		if (price === null) return "$0.00";
		const numericPrice = typeof price === "string" ? parseFloat(price) : price;
		return new Intl.NumberFormat("en-CA", {
			style: "currency",
			currency: "р",
		}).format(numericPrice);
	};

	const { groupedProducts, categories, brands, collections } = productsData;

	// Flatten all products from groups into a single array
	const allProducts = groupedProducts.flatMap((group) => group.products);

	// Handlers for refreshing data when new entities are created
	const handleEntityCreated = () => {
		// Invalidate dashboard products cache to refresh categories, brands, collections
		queryClient.invalidateQueries({
			queryKey: ["bfloorDashboardProducts"],
		});
	};

	// Filter products based on search
	const displayProducts = searchTerm
		? allProducts.filter(
				(product) =>
					product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
					product.slug.toLowerCase().includes(searchTerm.toLowerCase()),
			)
		: allProducts;

	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>,
	) => {
		const { name, value, type } = e.target;
		const checked = (e.target as HTMLInputElement).checked;

		let updatedFormData: ProductFormData = { ...formData };

		// Handle slug auto-generation
		if (name === "slug") {
			setIsAutoSlug(false);
		}

		// Handle regular form fields
		if (name === "discount") {
			// Handle discount field specifically - allow empty string to be converted to null
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

		// Handle variations creation
		if (name === "hasVariations" && checked && variations.length === 0) {
			const defaultVariation: Variation = {
				id: `temp-${Date.now()}`,
				sku: generateVariationSKU(updatedFormData.slug, [], attributes || []),
				price: updatedFormData.price ? parseFloat(updatedFormData.price) : 0,
				stock: updatedFormData.stock ? parseInt(updatedFormData.stock, 10) : 0,
				sort: 0,
				attributeValues: {},
			};
			setVariations([defaultVariation]);
		}

		setFormData(updatedFormData);
	};

	const handleEditChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>,
	) => {
		const { name, value, type } = e.target;
		const checked = (e.target as HTMLInputElement).checked;

		let updatedFormData: ProductFormData = { ...editFormData };

		// Handle slug auto-generation
		if (name === "slug") {
			setIsEditAutoSlug(false);
		}

		// Handle regular form fields
		if (name === "discount") {
			// Handle discount field specifically - allow empty string to be converted to null
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

		// Handle variations creation
		if (name === "hasVariations" && checked && editVariations.length === 0) {
			const defaultVariation: Variation = {
				id: `temp-${Date.now()}`,
				sku: generateVariationSKU(updatedFormData.slug, [], attributes || []), // Generate proper SKU
				price: updatedFormData.price ? parseFloat(updatedFormData.price) : 0,
				stock: updatedFormData.stock ? parseInt(updatedFormData.stock, 10) : 0,
				sort: 0,
				attributeValues: {}, // Empty attribute values initially
			};
			setEditVariations([defaultVariation]);
		}

		setEditFormData(updatedFormData);
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setHasAttemptedSubmit(true);

		// Collect validation errors
		const errors: string[] = [];
		if (!formData.name) errors.push("Product Name");
		if (!formData.slug) errors.push("Slug");
		if (!formData.price) errors.push("Price");
		if (!formData.categorySlug) errors.push("Category");

		if (errors.length > 0) {
			toast.error(`Please fill in all required fields: ${errors.join(", ")}`);
			return;
		}

		setIsSubmitting(true);
		setError("");

		try {
			const formattedVariations = variations.map((variation: Variation) => ({
				id: variation.id.startsWith("temp-")
					? undefined
					: parseInt(variation.id, 10),
				sku: variation.sku,
				price: variation.price.toString(),
				stock: variation.stock.toString(),
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
				variations: formattedVariations,
			};

			const result = await createProduct({ data: submissionData });

			// Update store locations
			if (selectedStoreLocationIds.length > 0) {
				await updateProductStoreLocations({
					data: {
						productId: result.product.id,
						storeLocationIds: selectedStoreLocationIds,
					},
				});
			}

			toast.success("Product added successfully!");

			// Reset form state and close modal
			closeCreateModal();

			// Refresh data
			refetch();
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "An error occurred";
			setError(errorMessage);
			toast.error(errorMessage);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!editingProductId) {
			return;
		}

		setIsSubmitting(true);
		setError("");

		try {
			// Delete images from R2 first
			if (editDeletedImages.length > 0) {
				const deletePromises = editDeletedImages.map((filename) =>
					deleteProductImage({ data: { filename } }).catch((error) => {
						console.error(`Failed to delete ${filename}:`, error);
						// Don't fail the whole update if one image deletion fails
					}),
				);
				await Promise.all(deletePromises);
				toast.success(
					`Deleted ${editDeletedImages.length} image(s) from storage`,
				);
			}

			const formattedVariations = editVariations.map(
				(variation: Variation) => ({
					id: variation.id.startsWith("temp-")
						? undefined
						: parseInt(variation.id, 10),
					sku: variation.sku,
					price: variation.price.toString(),
					stock: variation.stock.toString(),
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
				variations: formattedVariations,
			};

			await updateProduct({
				data: { id: editingProductId, data: submissionData },
			});

			// Update store locations
			await updateProductStoreLocations({
				data: {
					productId: editingProductId,
					storeLocationIds: editSelectedStoreLocationIds,
				},
			});

			toast.success("Product updated successfully!");

			// Reset form state
			closeEditModal();

			// Refresh dashboard data
			refetch();

			// Invalidate specific product cache
			invalidateProductCache(
				editingProductId,
				originalProductSlug,
				editFormData.slug,
			);
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "An error occurred";
			setError(errorMessage);
			toast.error(errorMessage);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteClick = (product: ProductWithVariations) => {
		setDeletingProductId(product.id);
		setShowDeleteDialog(true);
	};

	const handleDeleteConfirm = async () => {
		if (!deletingProductId) return;

		setIsDeleting(true);
		setError("");

		try {
			await deleteProduct({ data: { id: deletingProductId } });

			toast.success("Product deleted successfully!");
			setShowDeleteDialog(false);
			setDeletingProductId(null);

			// Refresh data
			refetch();
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
			toast.error(err instanceof Error ? err.message : "An error occurred");
		} finally {
			setIsDeleting(false);
		}
	};

	const handleDeleteCancel = () => {
		setShowDeleteDialog(false);
		setDeletingProductId(null);
	};

	const handleEdit = async (product: ProductWithVariations) => {
		setEditingProductId(product.id);
		setOriginalProductSlug(product.slug); // Store original slug
		setShowEditModal(true);
		setIsEditMode(true);

		try {
			// Fetch complete product data including variations and categories
			const productWithDetails = await getProductBySlug({
				data: { id: product.id },
			});

			// Convert variations to the new frontend format
			const formattedVariations =
				productWithDetails.variations?.map(
					(variation: ProductVariationWithAttributes) => {
						// Convert attributes array to attributeValues object
						const attributeValues: Record<string, string> = {};
						variation.attributes?.forEach((attr) => {
							attributeValues[attr.attributeId] = attr.value;
						});

						return {
							id: variation.id.toString(),
							sku: variation.sku,
							price: variation.price,
							stock: variation.stock,
							discount: variation.discount,
							sort: variation.sort ?? 0,
							attributeValues,
						};
					},
				) || [];

			// Extract selected attributes from variations
			const selectedAttributes = new Set<string>();
			formattedVariations.forEach((variation) => {
				Object.keys(variation.attributeValues).forEach((attrId) => {
					selectedAttributes.add(attrId);
				});
			});

			// Determine if slug is custom (doesn't match auto-generated)
			const isCustomSlug =
				productWithDetails.slug !== generateSlug(productWithDetails.name);

			// Convert images from JSON array to comma-separated string for the form
			let imagesString = "";
			if (productWithDetails.images) {
				try {
					const imagesArray = JSON.parse(productWithDetails.images) as string[];
					imagesString = imagesArray.join(", ");
				} catch {
					// If it's already a comma-separated string, use it as-is
					// Otherwise, try to clean up the JSON string
					if (typeof productWithDetails.images === "string") {
						// Check if it looks like a JSON array string
						if (
							productWithDetails.images.startsWith("[") &&
							productWithDetails.images.endsWith("]")
						) {
							// Try to extract filenames from the malformed JSON
							const matches = productWithDetails.images.match(/"([^"]+)"/g);
							if (matches) {
								const filenames = matches.map((match) =>
									match.replace(/"/g, ""),
								);
								imagesString = filenames.join(", ");
							} else {
								imagesString = "";
							}
						} else {
							// Assume it's already a comma-separated string
							imagesString = productWithDetails.images;
						}
					} else {
						imagesString = "";
					}
				}
			}

			// Parse product attributes from JSON
			let parsedAttributes: ProductAttributeFormData[] = [];
			if (productWithDetails.productAttributes) {
				try {
					parsedAttributes = JSON.parse(
						productWithDetails.productAttributes,
					) as ProductAttributeFormData[];
				} catch (error) {
					console.error("Error parsing product attributes:", error);
					parsedAttributes = [];
				}
			}

			// Parse product tags from JSON
			let parsedTags: string[] = [];
			if (productWithDetails.tags) {
				try {
					parsedTags = JSON.parse(productWithDetails.tags) as string[];
				} catch (error) {
					console.error("Error parsing product tags:", error);
					parsedTags = [];
				}
			}

			setEditFormData({
				name: productWithDetails.name,
				slug: productWithDetails.slug,
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
				stock: productWithDetails.stock.toString(),
				isActive: productWithDetails.isActive,
				isFeatured: productWithDetails.isFeatured,
				discount: productWithDetails.discount,
				hasVariations: productWithDetails.hasVariations,
				images: imagesString,
				attributes: parsedAttributes,
				variations: [],
			});

			// Load existing store locations for this product
			const existingStoreLocations = await getProductStoreLocations({
				data: { id: product.id },
			});
			setEditSelectedStoreLocationIds(
				existingStoreLocations
					.map((location) => location.storeLocationId)
					.filter((id): id is number => id !== null),
			);

			// Set auto-slug state based on whether slug is custom
			setIsEditAutoSlug(!isCustomSlug);

			// Set the variations and selected attributes separately
			setEditVariations(formattedVariations);
			setEditSelectedVariationAttributes(Array.from(selectedAttributes));
		} catch (error) {
			console.error("Error fetching product details:", error);
			toast.error("Failed to load product details");

			// Process images for fallback case too
			let fallbackImagesString = "";
			if (product.images) {
				try {
					const imagesArray = JSON.parse(product.images) as string[];
					fallbackImagesString = imagesArray.join(", ");
				} catch {
					// If it's already a comma-separated string, use it as-is
					// Otherwise, try to clean up the JSON string
					if (typeof product.images === "string") {
						// Check if it looks like a JSON array string
						if (
							product.images.startsWith("[") &&
							product.images.endsWith("]")
						) {
							// Try to extract filenames from the malformed JSON
							const matches = product.images.match(/"([^"]+)"/g);
							if (matches) {
								const filenames = matches.map((match) =>
									match.replace(/"/g, ""),
								);
								fallbackImagesString = filenames.join(", ");
							} else {
								fallbackImagesString = "";
							}
						} else {
							// Assume it's already a comma-separated string
							fallbackImagesString = product.images;
						}
					} else {
						fallbackImagesString = "";
					}
				}
			}

			// Fallback to basic product data from the list
			setEditFormData({
				name: product.name,
				slug: product.slug,
				description: product.description || "",
				importantNote: product.importantNote || "",
				tags: [],
				price: product.price.toString(),
				squareMetersPerPack: product.squareMetersPerPack?.toString() || "",
				unitOfMeasurement: product.unitOfMeasurement || "штука",
				categorySlug: product.categorySlug || "",
				brandSlug: product.brandSlug || "",
				collectionSlug: product.collectionSlug || "",
				stock: product.stock.toString(),
				isActive: product.isActive,
				isFeatured: product.isFeatured,
				discount: product.discount,
				hasVariations: product.hasVariations,
				images: fallbackImagesString,
				attributes: [],
				variations: [],
			});
			setEditVariations([]);
		}
	};

	return (
		<div>
			{/* Products List */}
			<div className="space-y-6">
				{displayProducts.length === 0 ? (
					<EmptyState entityType="products" isSearchResult={!!searchTerm} />
				) : (
					<div className="px-4">
						{/* Products Grid */}
						<div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 md:gap-3">
							{displayProducts.map((product) => (
								<AdminProductCard
									key={product.id}
									product={product}
									onEdit={handleEdit}
									onDelete={handleDeleteClick}
									formatPrice={formatPrice}
								/>
							))}
						</div>
					</div>
				)}
			</div>

			{/* Replace Edit Modal with Drawer */}
			<DashboardFormDrawer
				isOpen={showEditModal}
				onOpenChange={setShowEditModal}
				title="Редактировать товар"
				formId={editProductFormId}
				isSubmitting={isSubmitting}
				submitButtonText="Обновить товар"
				submittingText="Обновление..."
				onCancel={closeEditModal}
				error={error && isEditMode ? error : undefined}
				layout="two-column"
			>
				<form
					onSubmit={handleUpdate}
					id={editProductFormId}
					className="contents"
				>
					{/* Left Column - Images, Settings, Tags, Store Locations */}
					<div className="space-y-4 flex flex-col">
						{/* Product Images Block */}
						<DrawerSection variant="default">
							<ImageUpload
								currentImages={editFormData.images}
								onImagesChange={handleEditImagesChange}
								slug={editFormData.slug}
								categorySlug={editFormData.categorySlug}
								productName={editFormData.name}
							/>
						</DrawerSection>

						{/* Settings Block */}
						<DrawerSection variant="default" title="Настройки">
							<ProductSettingsFields
								isActive={editFormData.isActive}
								isFeatured={editFormData.isFeatured}
								discount={editFormData.discount}
								hasVariations={editFormData.hasVariations}
								onIsActiveChange={handleEditChange}
								onIsFeaturedChange={handleEditChange}
								onDiscountChange={handleEditChange}
								onHasVariationsChange={handleEditChange}
								idPrefix="edit"
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
								storeLocations={storeLocations}
								selectedLocationIds={editSelectedStoreLocationIds}
								onLocationChange={handleEditStoreLocationChange}
								idPrefix="edit"
							/>
						</DrawerSection>
					</div>

					{/* Right Column - Basic Information */}
					<div className="space-y-4 flex flex-col">
						{/* Basic Info */}
						<DrawerSection variant="default" title="Базовая информация">
							<div className="grid grid-cols-1 gap-4">
								<Input
									label="Название"
									type="text"
									name="name"
									value={editFormData.name}
									onChange={handleEditChange}
									required
								/>
								<SlugField
									slug={editFormData.slug}
									name={editFormData.name}
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
									idPrefix="edit"
								/>

								{/* Two column layout for basic information fields */}
								<div className="grid grid-cols-2 gap-4">
									{/* Column 1: Price, Category, Weight */}
									<div>
										<Input
											id={editPriceId}
											type="number"
											name="price"
											label="Цена р"
											value={editFormData.price}
											onChange={handleEditChange}
											step="0.01"
											required
										/>
									</div>

									{/* Column 2: Stock */}
									<div>
										<Input
											id={editStockId}
											type="number"
											name="stock"
											label="Количество"
											value={editFormData.stock}
											onChange={handleEditChange}
											required
										/>
									</div>

									{/* Square Meters Per Pack (for flooring products) */}
									<Input
										label="Площадь упаковки (м²)"
										type="number"
										name="squareMetersPerPack"
										value={editFormData.squareMetersPerPack || ""}
										onChange={handleEditChange}
										step="0.001"
										min="0"
										placeholder="Опционально - для напольных покрытий"
									/>

									{/* Unit of Measurement */}
									<div>
										<label
											htmlFor={editUnitId}
											className="block text-sm font-medium mb-1"
										>
											Единица количества
										</label>
										<select
											id={editUnitId}
											name="unitOfMeasurement"
											value={editFormData.unitOfMeasurement}
											onChange={handleEditChange}
											className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
										>
											{UNITS_OF_MEASUREMENT.map((unit) => (
												<option key={unit} value={unit}>
													{unit}
												</option>
											))}
										</select>
									</div>

									{/* Column 1: Category */}
									<div>
										<SelectWithCreate
											value={editFormData.categorySlug}
											onValueChange={(value) => {
												handleEditChange({
													target: { name: "categorySlug", value: value || "" },
												} as React.ChangeEvent<HTMLSelectElement>);
											}}
											placeholder="Выберите категорию"
											label="Категория"
											required
											id={editCategoryId}
											entityType="category"
											options={categories}
											onEntityCreated={handleEntityCreated}
										/>
									</div>

									{/* Column 2: Brand */}
									<div>
										<SelectWithCreate
											value={editFormData.brandSlug}
											onValueChange={(value) => {
												handleEditChange({
													target: { name: "brandSlug", value },
												} as React.ChangeEvent<HTMLSelectElement>);
											}}
											placeholder="Выберите бренд (опционально)"
											label="Бренд (опционально)"
											id={editBrandId}
											entityType="brand"
											options={brands}
											onEntityCreated={handleEntityCreated}
										/>
									</div>

									{/* Column 1: Collection */}
									<div>
										<SelectWithCreate
											value={editFormData.collectionSlug || null}
											onValueChange={(value) => {
												handleEditChange({
													target: { name: "collectionSlug", value },
												} as React.ChangeEvent<HTMLSelectElement>);
											}}
											placeholder="Выберите коллекцию (опционально)"
											label="Коллекция (опционально)"
											id={editCollectionId}
											entityType="collection"
											options={collections}
											brands={brands}
											onEntityCreated={handleEntityCreated}
										/>
									</div>

									{/* Column 2: Empty for grid alignment */}
									<div />

									{/* Empty cells for grid alignment */}
									<div />
									<div />
								</div>

								{/* Description Field */}
								<DescriptionField
									name="description"
									value={editFormData.description || ""}
									onChange={handleEditChange}
									placeholder="Добавьте описание товара..."
									className="min-h-[4rem]"
								/>

								{/* Important Note Field */}
								<DescriptionField
									name="importantNote"
									value={editFormData.importantNote || ""}
									onChange={handleEditChange}
									placeholder="Добавьте важную заметку с поддержкой Markdown..."
									className="min-h-[4rem]"
									label="Важная заметка"
								/>
							</div>
						</DrawerSection>
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
							{/* Attribute Selection */}
							<DrawerSection variant="default" className="lg:col-span-2">
								<ProductVariationAttributesSelector
									selectedAttributes={editSelectedVariationAttributes}
									onChange={setEditSelectedVariationAttributes}
								/>
							</DrawerSection>

							{/* Variations */}
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
				</form>
			</DashboardFormDrawer>

			{/* Create Product Drawer */}
			<DashboardFormDrawer
				isOpen={showCreateForm}
				onOpenChange={setShowCreateForm}
				title="Создать новый товар"
				formId={createProductFormId}
				isSubmitting={isSubmitting}
				submitButtonText="Создать товар"
				submittingText="Создание..."
				onCancel={closeCreateModal}
				error={error && !isEditMode ? error : undefined}
				layout="two-column"
			>
				<form
					onSubmit={handleSubmit}
					id={createProductFormId}
					className="contents"
				>
					{/* Left Column - Images, Settings, Tags, Store Locations */}
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

						{/* Settings Block */}
						<DrawerSection variant="default" title="Настройки">
							<ProductSettingsFields
								isActive={formData.isActive}
								isFeatured={formData.isFeatured}
								discount={formData.discount}
								hasVariations={formData.hasVariations}
								onIsActiveChange={handleChange}
								onIsFeaturedChange={handleChange}
								onDiscountChange={handleChange}
								onHasVariationsChange={handleChange}
								idPrefix="add"
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
								storeLocations={storeLocations}
								selectedLocationIds={selectedStoreLocationIds}
								onLocationChange={handleStoreLocationChange}
								idPrefix="create"
							/>
						</DrawerSection>
					</div>

					{/* Right Column - Basic Information */}
					<div className="space-y-4 flex flex-col">
						{/* Basic Info */}
						<DrawerSection variant="default" title="Базовая информация">
							<div className="grid grid-cols-1 gap-4">
								<Input
									label="Название товара"
									type="text"
									name="name"
									value={formData.name}
									onChange={handleChange}
									required
									className={
										hasAttemptedSubmit && !formData.name ? "border-red-500" : ""
									}
								/>
								<SlugField
									slug={formData.slug}
									name={formData.name}
									isAutoSlug={isAutoSlug}
									onSlugChange={(slug) => {
										setIsAutoSlug(false);
										setFormData((prev) => ({ ...prev, slug }));
									}}
									onAutoSlugChange={setIsAutoSlug}
									className={
										hasAttemptedSubmit && !formData.slug ? "border-red-500" : ""
									}
									idPrefix="create"
								/>

								{/* Two column layout for basic information fields */}
								<div className="grid grid-cols-2 gap-4">
									{/* Column 1: Price, Category, Weight */}
									<div>
										<Input
											id={addPriceId}
											type="number"
											name="price"
											label="Цена р"
											value={formData.price}
											onChange={handleChange}
											required
											step="0.01"
											min="0"
											className={cn(
												hasAttemptedSubmit && !formData.price
													? "border-red-500"
													: "",
											)}
										/>
									</div>

									{/* Column 2: Stock */}
									<Input
										label="Количество"
										type="number"
										name="stock"
										value={formData.stock}
										onChange={handleChange}
										min="0"
									/>

									{/* Square Meters Per Pack (for flooring products) */}
									<Input
										label="Площадь упаковки (м²)"
										type="number"
										name="squareMetersPerPack"
										value={formData.squareMetersPerPack || ""}
										onChange={handleChange}
										step="0.001"
										min="0"
										placeholder="Опционально - для напольных покрытий"
									/>

									{/* Unit of Measurement */}
									<div>
										<label
											htmlFor={createUnitId}
											className="block text-sm font-medium mb-1"
										>
											Единица количества
										</label>
										<select
											id={createUnitId}
											name="unitOfMeasurement"
											value={formData.unitOfMeasurement}
											onChange={handleChange}
											className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
										>
											{UNITS_OF_MEASUREMENT.map((unit) => (
												<option key={unit} value={unit}>
													{unit}
												</option>
											))}
										</select>
									</div>

									{/* Column 1: Category */}
									<div>
										<SelectWithCreate
											value={formData.categorySlug}
											onValueChange={(value) => {
												setFormData({
													...formData,
													categorySlug: value || "",
												});
											}}
											placeholder="Выберите категорию"
											label="Категория"
											required
											id={addCategoryId}
											entityType="category"
											options={categories}
											onEntityCreated={handleEntityCreated}
										/>
									</div>

									{/* Column 2: Brand */}
									<div>
										<SelectWithCreate
											value={formData.brandSlug}
											onValueChange={(value) => {
												setFormData({
													...formData,
													brandSlug: value,
												});
											}}
											placeholder="Выберите бренд (опционально)"
											label="Бренд (опционально)"
											id={addBrandId}
											entityType="brand"
											options={brands}
											onEntityCreated={handleEntityCreated}
										/>
									</div>

									{/* Column 1: Collection */}
									<div>
										<SelectWithCreate
											value={formData.collectionSlug || null}
											onValueChange={(value) => {
												setFormData({
													...formData,
													collectionSlug: value,
												});
											}}
											placeholder="Выберите коллекцию (опционально)"
											label="Коллекция (опционально)"
											id={addCollectionId}
											entityType="collection"
											options={collections}
											brands={brands}
											onEntityCreated={handleEntityCreated}
										/>
									</div>

									{/* Column 2: Empty for grid alignment */}
									<div />

									{/* Empty cells for grid alignment */}
									<div />
									<div />
								</div>

								{/* Description Field */}
								<DescriptionField
									name="description"
									value={formData.description || ""}
									onChange={handleChange}
									placeholder="Добавьте описание товара..."
									className="min-h-[4rem]"
								/>

								{/* Important Note Field */}
								<DescriptionField
									name="importantNote"
									value={formData.importantNote || ""}
									onChange={handleChange}
									placeholder="Добавьте важную заметку с поддержкой Markdown..."
									className="min-h-[4rem]"
									label="Важная заметка"
								/>
							</div>
						</DrawerSection>
					</div>

					{/* Product Attributes Block */}
					<DrawerSection variant="default" className="lg:col-span-2">
						<ProductAttributesForm
							attributes={formData.attributes || []}
							onChange={(attributes) =>
								setFormData({ ...formData, attributes })
							}
						/>
					</DrawerSection>

					{/* Variations Block */}
					{formData.hasVariations && (
						<>
							{/* Attribute Selection */}
							<DrawerSection variant="default" className="lg:col-span-2">
								<ProductVariationAttributesSelector
									selectedAttributes={selectedVariationAttributes}
									onChange={setSelectedVariationAttributes}
								/>
							</DrawerSection>

							{/* Variations */}
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
				</form>
			</DashboardFormDrawer>

			{/* Delete Confirmation Dialog */}
			{showDeleteDialog && (
				<DeleteConfirmationDialog
					isOpen={showDeleteDialog}
					onClose={handleDeleteCancel}
					onConfirm={handleDeleteConfirm}
					title="Удалить товар"
					description="Вы уверены, что хотите удалить этот товар? Это действие нельзя отменить."
					isDeleting={isDeleting}
				/>
			)}
		</div>
	);
}
