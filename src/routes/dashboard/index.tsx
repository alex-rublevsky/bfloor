import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { AdminProductCard } from "~/components/ui/dashboard/AdminProductCard";
import DeleteConfirmationDialog from "~/components/ui/dashboard/ConfirmationDialog";
import { DashboardFormDrawer } from "~/components/ui/dashboard/DashboardFormDrawer";
import { EnhancedDescriptionField } from "~/components/ui/dashboard/EnhancedDescriptionField";
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
import ProductFilters from "~/components/ui/store/ProductFilters";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/shared/Select";
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
import { 
	productsInfiniteQueryOptions, 
	brandsQueryOptions, 
	collectionsQueryOptions, 
	categoriesQueryOptions,
	storeLocationsQueryOptions 
} from "~/lib/queryOptions";
import { cn } from "~/lib/utils";
import { createProduct } from "~/server_functions/dashboard/store/createProduct";
import { deleteProduct } from "~/server_functions/dashboard/store/deleteProduct";
import { deleteProductImage } from "~/server_functions/dashboard/store/deleteProductImage";
import { getProductBySlug } from "~/server_functions/dashboard/store/getProductBySlug";
import { updateProduct } from "~/server_functions/dashboard/store/updateProduct";
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
	discount?: number | null;
	sort: number;
	attributeValues: Record<string, string>; // attributeId -> value mapping
}



// Support optional search param in URL
const validateSearch = (search: Record<string, unknown>) => {
    const result: { search?: string } = {};
    if (typeof search.search === "string") {
        result.search = search.search;
    }
    return result;
};

export const Route = createFileRoute("/dashboard/")({
    component: RouteComponent,
    pendingComponent: ProductsPageSkeleton,
    validateSearch,
});

// Hook to get responsive columns per row based on screen size
function useResponsiveColumns() {
	const [columnsPerRow, setColumnsPerRow] = useState(6);

	useEffect(() => {
		const updateColumns = () => {
			const width = window.innerWidth;
			if (width >= 1536) {
				setColumnsPerRow(6); // 2xl
			} else if (width >= 1280) {
				setColumnsPerRow(5); // xl
			} else if (width >= 1024) {
				setColumnsPerRow(4); // lg
			} else if (width >= 768) {
				setColumnsPerRow(3); // md
			} else {
				setColumnsPerRow(2); // sm and below
			}
		};

		// Set initial value
		updateColumns();

		// Update on resize
		window.addEventListener('resize', updateColumns);
		return () => window.removeEventListener('resize', updateColumns);
	}, []);

	return columnsPerRow;
}

function RouteComponent() {
	const queryClient = useQueryClient();
    const searchParams = Route.useSearch();
    const normalizedSearch = (() => {
        const value = typeof searchParams.search === 'string' ? searchParams.search : '';
        const trimmed = value.trim().replace(/\s+/g, ' ');
        return trimmed.length >= 2 ? trimmed : undefined;
    })();
const containerRef = useRef<HTMLDivElement>(null);
	const columnsPerRow = useResponsiveColumns();

// Dashboard filters state
const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
const [sortBy, setSortBy] = useState<"relevant" | "name" | "price-asc" | "price-desc" | "newest" | "oldest">("relevant");
const [currentPriceRange, setCurrentPriceRange] = useState<[number, number]>([0, 1000000]);

	const isValidSort = (v: string): v is typeof sortBy => {
		return (
			v === "relevant" ||
			v === "name" ||
			v === "price-asc" ||
			v === "price-desc" ||
			v === "newest" ||
			v === "oldest"
		);
	};

	// Use infinite query to track loading state
	const { 
		data: productsData, 
		isLoading, 
        isFetching,
		fetchNextPage, 
		hasNextPage, 
		isFetchingNextPage 
	} = useInfiniteQuery({
		...productsInfiniteQueryOptions(normalizedSearch, {
			categorySlug: selectedCategory ?? undefined,
			sort: sortBy,
		}),
        // Preserve previous data while new search loads
        placeholderData: (prev) => prev,
    });

	// Fetch all reference data separately with aggressive caching (3-day stale time)
	const { data: storeLocations = [] } = useQuery({
		...storeLocationsQueryOptions(),
	});

	const { data: brands = [] } = useQuery({
		...brandsQueryOptions(),
	});

	const { data: collections = [] } = useQuery({
		...collectionsQueryOptions(),
	});

	const { data: categories = [] } = useQuery({
		...categoriesQueryOptions(),
	});

	// Product attributes query
	const { data: attributes } = useProductAttributes();

	// Function to refetch data using query invalidation
	const refetch = () => {
		// Invalidate dashboard products infinite query
		queryClient.invalidateQueries({
			queryKey: ["bfloorDashboardProductsInfinite"],
		});

		// Remove store data cache completely - forces fresh fetch on all clients
		queryClient.removeQueries({
			queryKey: ["bfloorStoreDataInfinite"],
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
			queryKey: ["bfloorStoreDataInfinite"],
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
	const editDiscountId = useId();
	const addDiscountId = useId();

	const defaultFormData = {
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
	const [originalEditImages, setOriginalEditImages] = useState<string>("");

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
		setOriginalEditImages("");
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

	// Merge products from all pages
	const products = productsData?.pages?.flatMap((page) => page?.products ?? [])?.filter(Boolean) ?? [];
	
	// Debug logging
	console.log('Dashboard State:', {
		totalPages: productsData?.pages?.length,
		totalProducts: products.length,
		hasNextPage,
		isFetchingNextPage,
		lastPageInfo: productsData?.pages?.[productsData.pages.length - 1]?.pagination,
	});

    // Use merged products directly (search is applied server-side)
    const allProducts = products;

	// Handlers for refreshing data when new entities are created
	const handleEntityCreated = () => {
		// Invalidate reference data caches
		queryClient.invalidateQueries({
			queryKey: ["bfloorBrands"],
		});
		queryClient.invalidateQueries({
			queryKey: ["bfloorCollections"],
		});
		queryClient.invalidateQueries({
			queryKey: ["bfloorCategories"],
		});
	};

    // Server-side filtered list
    const displayProducts = allProducts;

// Virtualizer configuration - responsive columns handled by useResponsiveColumns hook
const itemHeight = 365;
const rowCount = Math.ceil(displayProducts.length / columnsPerRow);

const virtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => itemHeight,
    overscan: 8, // Render extra rows for smooth scrolling and pre-fetching
});

	// Re-measure rows when the number of columns changes (grid layout changes row heights)
	// biome-ignore lint/correctness/useExhaustiveDependencies: We intentionally re-measure when columns/grid change and the instance is stable
	useEffect(() => {
		virtualizer.measure();
	}, [columnsPerRow, virtualizer]);

// Re-measure on container width changes to account for responsive grid/gaps
useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
        virtualizer.measure();
    });
    ro.observe(el);
    return () => ro.disconnect();
}, [virtualizer]);


	// Helper function to get products for a specific row
	const getProductsForRow = (rowIndex: number) => {
		const startIndex = rowIndex * columnsPerRow;
		const endIndex = Math.min(startIndex + columnsPerRow, displayProducts.length);
		return displayProducts.slice(startIndex, endIndex);
	};

	// Infinite scroll - load more products when user scrolls near the end
	const virtualItems = virtualizer.getVirtualItems();
	useEffect(() => {
		const lastItem = virtualItems[virtualItems.length - 1];
		
		// Don't fetch if already fetching, no next page, or no items rendered
		if (!lastItem || !hasNextPage || isFetchingNextPage) return;
		
		// Fetch next page when user scrolls near the end
		// lastItem.index is the row index, rowCount is total rows
		// Trigger when within 15 rows of the end (prefetch for smooth scrolling)
		const threshold = rowCount - 8;
		
		if (lastItem.index >= threshold) {
			console.log('Fetching next page...', { 
				lastRowIndex: lastItem.index, 
				totalRows: rowCount,
				threshold,
				currentProducts: products.length,
				hasNextPage,
			});
			fetchNextPage();
		}
	}, [virtualItems, hasNextPage, isFetchingNextPage, rowCount, fetchNextPage, products.length]);

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
				storeLocationIds: selectedStoreLocationIds,
			};

			await createProduct({ data: submissionData });

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
			// Parse original and new images to compare
			const originalImages = originalEditImages
				? originalEditImages.split(",").map(img => img.trim()).filter(Boolean)
				: [];
			const newImages = editFormData.images
				? editFormData.images.split(",").map(img => img.trim()).filter(Boolean)
				: [];

			// Find images that were removed (in original but not in new)
			const removedImages = originalImages.filter(img => !newImages.includes(img));
			
			// Combine explicitly deleted images with automatically detected removed images
			const allImagesToDelete = [...new Set([...editDeletedImages, ...removedImages])];

			// Delete images from R2
			if (allImagesToDelete.length > 0) {
				const deletePromises = allImagesToDelete.map((filename) =>
					deleteProductImage({ data: { filename } }).catch((error) => {
						console.error(`Failed to delete ${filename}:`, error);
						// Don't fail the whole update if one image deletion fails
					}),
				);
				await Promise.all(deletePromises);
				if (allImagesToDelete.length > 0) {
					console.log(`Deleted ${allImagesToDelete.length} image(s) from storage`);
				}
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
				variations: formattedVariations,
				storeLocationIds: editSelectedStoreLocationIds,
			};

			await updateProduct({
				data: { id: editingProductId, data: submissionData },
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
			console.log('🔍 EDIT: Loading product data for:', product.id, product.name);
			// Fetch complete product data using the React Query cache (benefits from prefetch on hover)
			const productWithDetails = await queryClient.fetchQuery({
				queryKey: ["bfloorDashboardProduct", product.id],
				queryFn: () => getProductBySlug({ data: { id: product.id } }),
				staleTime: 1000 * 60 * 5,
			});
			console.log('🔍 EDIT: Product loaded - Tags:', productWithDetails.tags, 'Store Location ID:', productWithDetails.storeLocationId, 'Store Location IDs:', productWithDetails.storeLocationIds);
			console.log('🔍 EDIT: SKU field:', productWithDetails.sku);
			console.log('🔍 EDIT: All product fields:', Object.keys(productWithDetails));

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

			// Parse product attributes - already converted to array by getProductBySlug
			let parsedAttributes: ProductAttributeFormData[] = [];
			if (productWithDetails.productAttributes) {
				if (Array.isArray(productWithDetails.productAttributes)) {
					parsedAttributes = productWithDetails.productAttributes;
				} else if (typeof productWithDetails.productAttributes === 'string') {
					try {
						const parsed = JSON.parse(productWithDetails.productAttributes);
						parsedAttributes = Array.isArray(parsed) ? parsed : [];
					} catch (error) {
						console.error("Error parsing product attributes:", error);
						parsedAttributes = [];
					}
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

			// Store the original images for comparison during update
			setOriginalEditImages(imagesString);

			// Load existing store locations for this product
			const storeLocationIds = (productWithDetails.storeLocationIds || []).filter((id): id is number => id !== null);
			console.log('🔍 EDIT: Store locations from product data:', storeLocationIds);
			setEditSelectedStoreLocationIds(storeLocationIds);

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
				sku: product.sku || "",
				description: product.description || "",
				importantNote: product.importantNote || "",
				tags: [],
				price: product.price.toString(),
				squareMetersPerPack: product.squareMetersPerPack?.toString() || "",
				unitOfMeasurement: product.unitOfMeasurement || "штука",
				categorySlug: product.categorySlug || "",
				brandSlug: product.brandSlug || "",
				collectionSlug: product.collectionSlug || "",
				isActive: product.isActive,
				isFeatured: product.isFeatured,
				discount: product.discount,
				hasVariations: product.hasVariations,
				images: fallbackImagesString,
				attributes: [],
				variations: [],
			});
			// Store the original images for comparison during update
			setOriginalEditImages(fallbackImagesString);
			setEditVariations([]);
		}
	};

    // Show skeleton only on very first load with no data
    if (!productsData && (isLoading || isFetching)) {
		return <ProductsPageSkeleton />;
	}

	return (
		<>
            {/* Filters bar (reusing store ProductFilters for hide-on-scroll behavior) */}
            <div ref={containerRef}>
                <ProductFilters
                    categories={categories.map((c: any) => ({ ...c, count: (c as any).count ?? 0 }))}
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                    brands={brands.map((b: any) => ({ slug: b.slug, name: b.name }))}
                    selectedBrand={selectedBrand}
                    onBrandChange={setSelectedBrand}
                    collections={collections.map((co: any) => ({ slug: co.slug, name: co.name }))}
                    selectedCollection={selectedCollection}
                    onCollectionChange={setSelectedCollection}
                    priceRange={{ min: 0, max: 1000000 }}
                    currentPriceRange={currentPriceRange}
                    onPriceRangeChange={setCurrentPriceRange}
                    sortBy={sortBy}
                    onSortChange={(v) => { if (isValidSort(v)) setSortBy(v as any); }}
                />
                {/* Products List - Virtualized for performance */}
				{displayProducts.length === 0 && !isFetching ? (
					<EmptyState entityType="products" isSearchResult={!!normalizedSearch} />
				) : (
					<div
						className="relative px-4 py-4"
						style={{
							height: `${virtualizer.getTotalSize()}px`,
						}}
					>
						{virtualizer.getVirtualItems().map((virtualRow) => {
							const rowProducts = getProductsForRow(virtualRow.index);
							return (
								<div
									key={virtualRow.key}
									data-index={virtualRow.index}
									ref={virtualizer.measureElement}
									className="absolute top-0 left-0 w-full"
									style={{
										height: `${virtualRow.size}px`,
										transform: `translate3d(0, ${virtualRow.start}px, 0)`,
										willChange: 'transform',
										contain: 'layout paint size',
									}}
								>
									<div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 md:gap-3">
										{rowProducts.map((product: ProductWithVariations) => (
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
						);
						})}
						{/* Loading indicator for next page */}
						{isFetchingNextPage && (
							<div className="absolute top-0 left-0 w-full flex items-center justify-center p-8">
								<p className="text-muted-foreground">Загрузка...</p>
							</div>
						)}
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

					{/* Description Field - Moved to left column */}
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
							label="" // Remove label to use only the DrawerSection title
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

								<Input
									label="Артикул (SKU)"
									type="text"
									name="sku"
									value={editFormData.sku || ""}
									onChange={handleEditChange}
									placeholder="Опционально - уникальный артикул товара"
								/>

							{/* Settings Fields */}
							<ProductSettingsFields
								isActive={editFormData.isActive}
								isFeatured={editFormData.isFeatured}
								hasVariations={editFormData.hasVariations}
								onIsActiveChange={handleEditChange}
								onIsFeaturedChange={handleEditChange}
								onHasVariationsChange={handleEditChange}
								idPrefix="edit"
							/>

							{/* Two column layout for basic information fields */}
							<div className="grid grid-cols-2 gap-4">
								{/* Column 1: Price */}
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

								{/* Column 2: Discount */}
								<div>
									<Input
										id={editDiscountId}
										type="number"
										name="discount"
										label="Скидка %"
										value={editFormData.discount || ""}
										onChange={handleEditChange}
										min="0"
										max="100"
										placeholder="Опционально"
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
										placeholder="Опционально"
									/>

									{/* Unit of Measurement */}
									<div>
										<label
											htmlFor={editUnitId}
											className="block text-sm font-medium mb-1"
										>
											Единица количества
										</label>
										<Select
											value={editFormData.unitOfMeasurement}
											onValueChange={(value) => {
												handleEditChange({
													target: { name: "unitOfMeasurement", value },
												} as React.ChangeEvent<HTMLSelectElement>);
											}}
										>
											<SelectTrigger id={editUnitId}>
												<SelectValue placeholder="Выберите единицу" />
											</SelectTrigger>
											<SelectContent>
												{UNITS_OF_MEASUREMENT.map((unit) => (
													<SelectItem key={unit} value={unit}>
														{unit}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>

							{/* Category, Brand, and Collection in one row */}
							<div className="col-span-2 flex flex-wrap gap-4">
								{/* Category */}
								<div className="flex-1 min-w-[150px]">
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

								{/* Brand */}
								<div className="flex-1 min-w-[150px]">
									<SelectWithCreate
										value={editFormData.brandSlug}
										onValueChange={(value) => {
											handleEditChange({
												target: { name: "brandSlug", value },
											} as React.ChangeEvent<HTMLSelectElement>);
										}}
										placeholder="Выберите бренд"
										label="Бренд"
										id={editBrandId}
										entityType="brand"
										options={brands}
										onEntityCreated={handleEntityCreated}
									/>
								</div>

								{/* Collection */}
								<div className="flex-1 min-w-[150px]">
									<SelectWithCreate
										value={editFormData.collectionSlug || null}
										onValueChange={(value) => {
											handleEditChange({
												target: { name: "collectionSlug", value },
											} as React.ChangeEvent<HTMLSelectElement>);
										}}
										placeholder="Выберите коллекцию"
										label="Коллекция"
										id={editCollectionId}
										entityType="collection"
										options={collections}
										brands={brands}
										onEntityCreated={handleEntityCreated}
									/>
								</div>
							</div>
							</div>
						</div> {/* Close grid-cols-1 gap-4 */}
					</DrawerSection>

					{/* Important Note Field - Separated into its own section */}
					<DrawerSection variant="default" title="Важная заметка">
						<EnhancedDescriptionField
							name="importantNote"
							value={editFormData.importantNote || ""}
							onChange={handleEditChange}
							placeholder="Добавьте важную заметку с поддержкой Markdown..."
							className="min-h-[4rem]"
							label="" // Remove label to use only the DrawerSection title
							showPreview={true}
							showHelp={true}
						/>
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
							storeLocations={storeLocations}
							selectedLocationIds={selectedStoreLocationIds}
							onLocationChange={handleStoreLocationChange}
							idPrefix="create"
						/>
					</DrawerSection>

					{/* Description Field - Moved to left column */}
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
							label="" // Remove label to use only the DrawerSection title
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

								<Input
									label="Артикул (SKU)"
									type="text"
									name="sku"
									value={formData.sku || ""}
									onChange={handleChange}
									placeholder="Опционально - уникальный артикул товара"
								/>

							{/* Settings Fields */}
							<ProductSettingsFields
								isActive={formData.isActive}
								isFeatured={formData.isFeatured}
								hasVariations={formData.hasVariations}
								onIsActiveChange={handleChange}
								onIsFeaturedChange={handleChange}
								onHasVariationsChange={handleChange}
								idPrefix="add"
							/>

							{/* Two column layout for basic information fields */}
							<div className="grid grid-cols-2 gap-4">
								{/* Column 1: Price */}
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

								{/* Column 2: Discount */}
								<div>
									<Input
										id={addDiscountId}
										type="number"
										name="discount"
										label="Скидка %"
										value={formData.discount || ""}
										onChange={handleChange}
										min="0"
										max="100"
										placeholder="Опционально"
									/>
								</div>

									{/* Square Meters Per Pack (for flooring products) */}
									<Input
										label="Площадь упаковки (м²)"
										type="number"
										name="squareMetersPerPack"
										value={formData.squareMetersPerPack || ""}
										onChange={handleChange}
										step="0.001"
										min="0"
										placeholder="Опционально"
									/>

									{/* Unit of Measurement */}
									<div>
										<label
											htmlFor={createUnitId}
											className="block text-sm font-medium mb-1"
										>
											Единица количества
										</label>
										<Select
											value={formData.unitOfMeasurement}
											onValueChange={(value) => {
												handleChange({
													target: { name: "unitOfMeasurement", value },
												} as React.ChangeEvent<HTMLSelectElement>);
											}}
										>
											<SelectTrigger id={createUnitId}>
												<SelectValue placeholder="Выберите единицу" />
											</SelectTrigger>
											<SelectContent>
												{UNITS_OF_MEASUREMENT.map((unit) => (
													<SelectItem key={unit} value={unit}>
														{unit}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>

							{/* Category, Brand, and Collection in one row */}
							<div className="col-span-2 flex flex-wrap gap-4">
								{/* Category */}
								<div className="flex-1 min-w-[150px]">
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

								{/* Brand */}
								<div className="flex-1 min-w-[150px]">
									<SelectWithCreate
										value={formData.brandSlug}
										onValueChange={(value) => {
											setFormData({
												...formData,
												brandSlug: value,
											});
										}}
										placeholder="Выберите бренд"
										label="Бренд"
										id={addBrandId}
										entityType="brand"
										options={brands}
										onEntityCreated={handleEntityCreated}
									/>
								</div>

								{/* Collection */}
								<div className="flex-1 min-w-[150px]">
									<SelectWithCreate
										value={formData.collectionSlug || null}
										onValueChange={(value) => {
											setFormData({
												...formData,
												collectionSlug: value,
											});
										}}
										placeholder="Выберите коллекцию"
										label="Коллекция"
										id={addCollectionId}
										entityType="collection"
										options={collections}
										brands={brands}
										onEntityCreated={handleEntityCreated}
									/>
								</div>
							</div>
							</div>
						</div> {/* Close grid-cols-1 gap-4 */}
					</DrawerSection>

					{/* Important Note Field - Separated into its own section */}
					<DrawerSection variant="default" title="Важная заметка">
						<EnhancedDescriptionField
							name="importantNote"
							value={formData.importantNote || ""}
							onChange={handleChange}
							placeholder="Добавьте важную заметку с поддержкой Markdown..."
							className="min-h-[4rem]"
							label="" // Remove label to use only the DrawerSection title
							showPreview={true}
							showHelp={true}
						/>
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
		</>
	);
}
