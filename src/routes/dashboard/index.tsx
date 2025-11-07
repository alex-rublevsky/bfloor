import {
	useInfiniteQuery,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import {
	createFileRoute,
	stripSearchParams,
	useElementScrollRestoration,
} from "@tanstack/react-router";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { Trash2 } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
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
import { ProductsPageSkeleton } from "~/components/ui/dashboard/skeletons/ProductsPageSkeleton";
import { SlugField } from "~/components/ui/dashboard/SlugField";
import { StoreLocationsSelector } from "~/components/ui/dashboard/StoreLocationsSelector";
import { Button } from "~/components/ui/shared/Button";
import { CheckboxList } from "~/components/ui/shared/CheckboxList";
import { EmptyState } from "~/components/ui/shared/EmptyState";
import { Input } from "~/components/ui/shared/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/shared/Select";
import ProductFilters from "~/components/ui/store/ProductFilters";
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
	brandsQueryOptions,
	categoriesQueryOptions,
	collectionsQueryOptions,
	productsInfiniteQueryOptions,
	storeLocationsQueryOptions,
} from "~/lib/queryOptions";
import { createProduct } from "~/server_functions/dashboard/store/createProduct";
import { deleteProduct } from "~/server_functions/dashboard/store/deleteProduct";
import { deleteProductImage } from "~/server_functions/dashboard/store/deleteProductImage";
import { getProductBySlug } from "~/server_functions/dashboard/store/getProductBySlug";
import { moveStagingImages } from "~/server_functions/dashboard/store/moveStagingImages";
import { updateProduct } from "~/server_functions/dashboard/store/updateProduct";
import type {
	Brand,
	CategoryWithCount,
	Collection,
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

// Search params validation for all filter options and search
const validateSearch = (search: Record<string, unknown>) => {
	const result: {
		search?: string;
		category?: string;
		brand?: string;
		collection?: string;
		sort?:
			| "relevant"
			| "name"
			| "price-asc"
			| "price-desc"
			| "newest"
			| "oldest";
	} = {};

	if (typeof search.search === "string") {
		result.search = search.search;
	}

	if (typeof search.category === "string") {
		result.category = search.category;
	}

	if (typeof search.brand === "string") {
		result.brand = search.brand;
	}

	if (typeof search.collection === "string") {
		result.collection = search.collection;
	}

	if (
		typeof search.sort === "string" &&
		(search.sort === "relevant" ||
			search.sort === "name" ||
			search.sort === "price-asc" ||
			search.sort === "price-desc" ||
			search.sort === "newest" ||
			search.sort === "oldest")
	) {
		result.sort = search.sort;
	}

	return result;
};

export const Route = createFileRoute("/dashboard/")({
	component: RouteComponent,
	pendingComponent: ProductsPageSkeleton,
	validateSearch,
	// Strip undefined values from URL to keep it clean
	search: {
		middlewares: [stripSearchParams({})],
	},
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
		window.addEventListener("resize", updateColumns);
		return () => window.removeEventListener("resize", updateColumns);
	}, []);

	return columnsPerRow;
}

function RouteComponent() {
	const queryClient = useQueryClient();

	// Get search params from URL using TanStack Router
	const searchParams = Route.useSearch();
	const navigate = Route.useNavigate();

	const normalizedSearch = (() => {
		const value =
			typeof searchParams.search === "string" ? searchParams.search : "";
		const trimmed = value.trim().replace(/\s+/g, " ");
		return trimmed.length >= 2 ? trimmed : undefined;
	})();
	const containerRef = useRef<HTMLDivElement>(null);
	const columnsPerRow = useResponsiveColumns();

	// Initialize filter state from URL search params
	const [selectedCategory, setSelectedCategory] = useState<string | null>(
		searchParams.category ?? null,
	);
	const [selectedBrand, setSelectedBrand] = useState<string | null>(
		searchParams.brand ?? null,
	);
	const [selectedCollection, setSelectedCollection] = useState<string | null>(
		searchParams.collection ?? null,
	);
	const [sortBy, setSortBy] = useState<
		"relevant" | "name" | "price-asc" | "price-desc" | "newest" | "oldest"
	>(searchParams.sort ?? "relevant");
	const [currentPriceRange, setCurrentPriceRange] = useState<[number, number]>([
		0, 1000000,
	]);

	// Sync state with URL when search params change (e.g., from browser back/forward)
	useEffect(() => {
		setSelectedCategory(searchParams.category ?? null);
		setSelectedBrand(searchParams.brand ?? null);
		setSelectedCollection(searchParams.collection ?? null);
		setSortBy(searchParams.sort ?? "relevant");
	}, [
		searchParams.category,
		searchParams.brand,
		searchParams.collection,
		searchParams.sort,
	]);

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

	// Update URL when filters change
	const updateCategory = (category: string | null) => {
		setSelectedCategory(category);
		navigate({
			search: {
				...searchParams,
				category: category ?? undefined,
			},
			replace: true,
		});
	};

	const updateBrand = (brand: string | null) => {
		setSelectedBrand(brand);
		navigate({
			search: {
				...searchParams,
				brand: brand ?? undefined,
			},
			replace: true,
		});
	};

	const updateCollection = (collection: string | null) => {
		setSelectedCollection(collection);
		navigate({
			search: {
				...searchParams,
				collection: collection ?? undefined,
			},
			replace: true,
		});
	};

	const updateSort = (sort: typeof sortBy) => {
		setSortBy(sort);
		navigate({
			search: {
				...searchParams,
				sort: sort !== "relevant" ? sort : undefined,
			},
			replace: true,
		});
	};

	// Use infinite query to track loading state
	const {
		data: productsData,
		isLoading,
		isFetching,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		refetch: refetchProducts,
	} = useInfiniteQuery({
		...productsInfiniteQueryOptions(normalizedSearch, {
			categorySlug: selectedCategory ?? undefined,
			brandSlug: selectedBrand ?? undefined,
			collectionSlug: selectedCollection ?? undefined,
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
		// Completely remove and reset all cached pages - forces full refetch from page 1
		queryClient.removeQueries({
			queryKey: ["bfloorDashboardProductsInfinite"],
		});

		queryClient.resetQueries({
			queryKey: ["bfloorDashboardProductsInfinite"],
		});

		// Remove store data cache completely - forces fresh fetch on all clients
		queryClient.removeQueries({
			queryKey: ["bfloorStoreDataInfinite"],
		});

		// Refetch the products query to get fresh data
		refetchProducts();
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

		// Invalidate brand and attribute counts since products changed
		queryClient.invalidateQueries({
			queryKey: ["productBrandCounts"],
		});
		queryClient.invalidateQueries({
			queryKey: ["productAttributeCounts"],
		});
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
	const [hasAttemptedEditSubmit, setHasAttemptedEditSubmit] = useState(false);
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
		setHasAttemptedEditSubmit(false);
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
	const products =
		productsData?.pages
			?.flatMap((page) => page?.products ?? [])
			?.filter(Boolean) ?? [];

	// Debug logging removed

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

	// Scroll restoration for virtualized list
	// Following TanStack Router docs: https://tanstack.com/router/v1/docs/framework/react/guide/scroll-restoration#manual-scroll-restoration
	const scrollEntry = useElementScrollRestoration({
		getElement: () => window,
	});

	// Virtualizer configuration - responsive columns handled by useResponsiveColumns hook
	// Following TanStack Virtual dynamic example pattern: https://tanstack.com/virtual/latest/docs/framework/react/examples/dynamic
	const itemHeight = 365;
	const rowCount = Math.ceil(displayProducts.length / columnsPerRow);

	const virtualizer = useWindowVirtualizer({
		count: rowCount,
		estimateSize: () => itemHeight,
		overscan: 8,
		initialOffset: scrollEntry?.scrollY,
	});

	// Re-measure rows when the number of columns changes
	// biome-ignore lint/correctness/useExhaustiveDependencies: We intentionally re-measure when columns change
	useEffect(() => {
		virtualizer.measure();
	}, [columnsPerRow, virtualizer]);

	// Re-measure on container width changes
	useEffect(() => {
		const el = containerRef.current;
		if (!el || typeof ResizeObserver === "undefined") return;
		const ro = new ResizeObserver(() => {
			virtualizer.measure();
		});
		ro.observe(el);
		return () => ro.disconnect();
	}, [virtualizer]);

	// Helper function to get products for a specific row
	const getProductsForRow = (rowIndex: number) => {
		const startIndex = rowIndex * columnsPerRow;
		const endIndex = Math.min(
			startIndex + columnsPerRow,
			displayProducts.length,
		);
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
			fetchNextPage();
		}
	}, [virtualItems, hasNextPage, isFetchingNextPage, rowCount, fetchNextPage]);

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

		// Validate required fields and scroll to first invalid field
		if (!formData.name) {
			const nameInput = document.querySelector(
				`#${createProductFormId} input[name="name"]`,
			) as HTMLElement;
			if (nameInput) {
				nameInput.scrollIntoView({ behavior: "smooth", block: "center" });
				nameInput.focus();
			}
			return;
		}
		if (!formData.slug) {
			const slugInput = document.querySelector(
				`#${createProductFormId} input[name="slug"]`,
			) as HTMLElement;
			if (slugInput) {
				slugInput.scrollIntoView({ behavior: "smooth", block: "center" });
				slugInput.focus();
			}
			return;
		}
		if (!formData.price) {
			const priceInput = document.querySelector(
				`#${createProductFormId} input[name="price"]`,
			) as HTMLElement;
			if (priceInput) {
				priceInput.scrollIntoView({ behavior: "smooth", block: "center" });
				priceInput.focus();
			}
			return;
		}
		if (!formData.categorySlug) {
			const categorySelect = document.getElementById(addCategoryId);
			if (categorySelect) {
				categorySelect.scrollIntoView({ behavior: "smooth", block: "center" });
				categorySelect.focus();
			}
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

			console.log("📦 Product create - staging images check:", {
				images,
				stagingImages,
				stagingCount: stagingImages.length,
			});

			// Move staging images to final location before creating product
			let finalImagePaths = images;
			if (stagingImages.length > 0) {
				console.log("🚀 Starting to move staging images...");
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

					console.log("📥 Move result received:", {
						success: moveResult?.success,
						movedCount: moveResult?.movedImages?.length,
						pathMapKeys: moveResult?.pathMap
							? Object.keys(moveResult.pathMap)
							: [],
						failedCount: moveResult?.failedImages?.length,
					});

					if (moveResult?.movedImages && moveResult?.pathMap) {
						// Replace staging paths with final paths using pathMap
						finalImagePaths = images.map((img) => {
							return moveResult.pathMap?.[img] || img;
						});
						console.log("🔄 Updated image paths:", {
							original: images,
							final: finalImagePaths,
							pathMap: moveResult.pathMap,
						});
					} else if (
						moveResult?.movedImages &&
						moveResult.movedImages.length > 0
					) {
						// Fallback to index-based mapping if pathMap not available
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
						console.log("🔄 Updated image paths (fallback):", {
							original: images,
							final: finalImagePaths,
						});
					} else {
						// No images were moved - this is a problem
						console.error("❌ No images were moved!", {
							moveResult,
							stagingImages,
						});
						toast.error(
							"Не удалось переместить изображения. Они останутся в staging.",
						);
					}

					if (moveResult?.failedImages && moveResult.failedImages.length > 0) {
						console.warn(
							"⚠️ Some images failed to move:",
							moveResult.failedImages,
						);
						toast.warning(
							`${moveResult.failedImages.length} изображение(й) не удалось переместить. Они останутся в staging и будут очищены автоматически.`,
						);
					}
				} catch (moveError) {
					console.error("❌ Failed to move staging images:", moveError);
					console.error("Error details:", {
						message:
							moveError instanceof Error
								? moveError.message
								: String(moveError),
						stack: moveError instanceof Error ? moveError.stack : undefined,
					});
					// Continue anyway - images are already uploaded, just in staging
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
				images: finalImagePaths.join(", "), // Use final paths (after moving staging)
				variations: formattedVariations,
				storeLocationIds: selectedStoreLocationIds,
			};

			// Safety check: Don't save if we still have staging paths
			const stillHasStaging = finalImagePaths.some((img) =>
				img.startsWith("staging/"),
			);
			if (stillHasStaging) {
				console.error(
					"❌ Still has staging paths after move attempt:",
					finalImagePaths,
				);
				throw new Error(
					"Не удалось переместить изображения из staging. Пожалуйста, попробуйте еще раз.",
				);
			}

			console.log("💾 Creating product with image paths:", {
				originalImages: formData.images,
				finalImagePaths,
				imagesString: submissionData.images,
			});

			await createProduct({ data: submissionData });

			toast.success("Product added successfully!");

			// Reset form state and close modal
			closeCreateModal();

			// Refresh data
			refetch();

			// Invalidate brand and attribute counts since a product was created
			queryClient.invalidateQueries({
				queryKey: ["productBrandCounts"],
			});
			queryClient.invalidateQueries({
				queryKey: ["productAttributeCounts"],
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

	const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!editingProductId) {
			return;
		}

		setHasAttemptedEditSubmit(true);

		// Validate required fields and scroll to first invalid field
		if (!editFormData.name) {
			const nameInput = document.querySelector(
				`#${editProductFormId} input[name="name"]`,
			) as HTMLElement;
			if (nameInput) {
				nameInput.scrollIntoView({ behavior: "smooth", block: "center" });
				nameInput.focus();
			}
			return;
		}
		if (!editFormData.slug) {
			const slugInput = document.querySelector(
				`#${editProductFormId} input[name="slug"]`,
			) as HTMLElement;
			if (slugInput) {
				slugInput.scrollIntoView({ behavior: "smooth", block: "center" });
				slugInput.focus();
			}
			return;
		}
		if (!editFormData.price) {
			const priceInput = document.querySelector(
				`#${editProductFormId} input[name="price"]`,
			) as HTMLElement;
			if (priceInput) {
				priceInput.scrollIntoView({ behavior: "smooth", block: "center" });
				priceInput.focus();
			}
			return;
		}
		if (!editFormData.categorySlug) {
			const categorySelect = document.getElementById(editCategoryId);
			if (categorySelect) {
				categorySelect.scrollIntoView({ behavior: "smooth", block: "center" });
				categorySelect.focus();
			}
			return;
		}

		setIsSubmitting(true);
		setError("");

		try {
			// Parse original and new images to compare
			const originalImages = originalEditImages
				? originalEditImages
						.split(",")
						.map((img) => img.trim())
						.filter(Boolean)
				: [];
			const newImages = editFormData.images
				? editFormData.images
						.split(",")
						.map((img) => img.trim())
						.filter(Boolean)
				: [];

			// Identify staging images that need to be moved
			const stagingImages = newImages.filter((img) =>
				img.startsWith("staging/"),
			);

			console.log("📦 Product update - staging images check:", {
				newImages,
				stagingImages,
				stagingCount: stagingImages.length,
			});

			// Move staging images to final location before updating product
			let finalImagePaths = newImages;
			if (stagingImages.length > 0) {
				console.log("🚀 Starting to move staging images...");
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
						// Replace staging paths with final paths using pathMap
						finalImagePaths = newImages.map((img) => {
							return moveResult.pathMap?.[img] || img;
						});
						console.log("🔄 Updated image paths:", {
							original: newImages,
							final: finalImagePaths,
							pathMap: moveResult.pathMap,
						});
					} else if (moveResult?.movedImages) {
						// Fallback to index-based mapping if pathMap not available
						finalImagePaths = newImages.map((img) => {
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

					if (moveResult?.failedImages && moveResult.failedImages.length > 0) {
						console.warn(
							"⚠️ Some images failed to move:",
							moveResult.failedImages,
						);
						toast.warning(
							`${moveResult.failedImages.length} изображение(й) не удалось переместить. Они останутся в staging и будут очищены автоматически.`,
						);
					}
				} catch (moveError) {
					console.error("Failed to move staging images:", moveError);
					// Continue anyway - images are already uploaded, just in staging
					toast.warning(
						"Изображения загружены, но не перемещены. Они будут очищены автоматически.",
					);
				}
			}

			// Find images that were removed (in original but not in new)
			// Compare with final paths (after moving staging images)
			const removedImages = originalImages.filter(
				(img) => !finalImagePaths.includes(img),
			);

			// Combine explicitly deleted images with automatically detected removed images
			const allImagesToDelete = [
				...new Set([...editDeletedImages, ...removedImages]),
			];

			// Delete images from R2 (only non-staging images - staging images are already moved)
			const imagesToDelete = allImagesToDelete.filter(
				(img) => !img.startsWith("staging/"),
			);
			if (imagesToDelete.length > 0) {
				const deletePromises = imagesToDelete.map((filename) =>
					deleteProductImage({ data: { filename } }).catch((error) => {
						console.error(`Failed to delete ${filename}:`, error);
						// Don't fail the whole update if one image deletion fails
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
				images: finalImagePaths.join(", "), // Use final paths (after moving staging)
				variations: formattedVariations,
				storeLocationIds: editSelectedStoreLocationIds,
			};

			// Safety check: Don't save if we still have staging paths
			const stillHasStaging = finalImagePaths.some((img) =>
				img.startsWith("staging/"),
			);
			if (stillHasStaging) {
				console.error(
					"❌ Still has staging paths after move attempt:",
					finalImagePaths,
				);
				throw new Error(
					"Не удалось переместить изображения из staging. Пожалуйста, попробуйте еще раз.",
				);
			}

			console.log("💾 Saving product with image paths:", {
				originalImages: editFormData.images,
				finalImagePaths,
				imagesString: submissionData.images,
			});

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

			// Invalidate brand and attribute counts since a product was deleted
			queryClient.invalidateQueries({
				queryKey: ["productBrandCounts"],
			});
			queryClient.invalidateQueries({
				queryKey: ["productAttributeCounts"],
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
		setDeletingProductId(null);
	};

	const handleEdit = async (product: ProductWithVariations) => {
		setEditingProductId(product.id);
		setOriginalProductSlug(product.slug); // Store original slug
		setShowEditModal(true);
		setIsEditMode(true);

		try {
			// Removed edit debug log
			// Fetch complete product data using the React Query cache (benefits from prefetch on hover)
			const productWithDetails = await queryClient.fetchQuery({
				queryKey: ["bfloorDashboardProduct", product.id],
				queryFn: () => getProductBySlug({ data: { id: product.id } }),
				staleTime: 1000 * 60 * 5,
			});
			// Removed verbose product load logs

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
				} else if (typeof productWithDetails.productAttributes === "string") {
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
			const storeLocationIds = (
				productWithDetails.storeLocationIds || []
			).filter((id): id is number => id !== null);
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
					categories={categories.map(
						(c): CategoryWithCount => ({
							...c,
							count: 0,
						}),
					)}
					selectedCategory={selectedCategory}
					onCategoryChange={updateCategory}
					brands={brands.map((b: Brand) => ({ slug: b.slug, name: b.name }))}
					selectedBrand={selectedBrand}
					onBrandChange={updateBrand}
					collections={collections.map((co: Collection) => ({
						slug: co.slug,
						name: co.name,
					}))}
					selectedCollection={selectedCollection}
					onCollectionChange={updateCollection}
					priceRange={{ min: 0, max: 1000000 }}
					currentPriceRange={currentPriceRange}
					onPriceRangeChange={setCurrentPriceRange}
					sortBy={sortBy}
					onSortChange={(v) => {
						if (isValidSort(v)) updateSort(v);
					}}
				/>
				{/* Products List - Virtualized for performance */}
				{displayProducts.length === 0 && !isFetching ? (
					<EmptyState
						entityType="products"
						isSearchResult={!!normalizedSearch}
					/>
				) : (
					<div
						className="relative px-4 py-4"
						style={{
							height: `${virtualizer.getTotalSize()}px`,
							width: "100%",
							position: "relative",
						}}
					>
						{/* Following TanStack Virtual dynamic example pattern for useWindowVirtualizer */}
						{virtualizer.getVirtualItems().map((virtualRow) => {
							const rowProducts = getProductsForRow(virtualRow.index);
							return (
								<div
									key={virtualRow.key}
									data-index={virtualRow.index}
									ref={virtualizer.measureElement}
									style={{
										position: "absolute",
										top: 0,
										left: 0,
										width: "100%",
										transform: `translateY(${virtualRow.start}px)`,
									}}
								>
									<div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 md:gap-3">
										{rowProducts.map((product: ProductWithVariations) => (
											<AdminProductCard
												key={product.id}
												product={product}
												onEdit={handleEdit}
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
									error={
										hasAttemptedEditSubmit && !editFormData.name
											? "обязательно"
											: undefined
									}
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
									error={
										hasAttemptedEditSubmit && !editFormData.slug
											? "обязательно"
											: undefined
									}
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
											error={
												hasAttemptedEditSubmit && !editFormData.price
													? "обязательно"
													: undefined
											}
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
														target: {
															name: "categorySlug",
															value: value || "",
														},
													} as React.ChangeEvent<HTMLSelectElement>);
												}}
												placeholder="Выберите категорию"
												label="Категория"
												required
												id={editCategoryId}
												entityType="category"
												options={categories}
												onEntityCreated={handleEntityCreated}
												error={
													hasAttemptedEditSubmit && !editFormData.categorySlug
														? "обязательно"
														: undefined
												}
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
							</div>{" "}
							{/* Close grid-cols-1 gap-4 */}
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

					{/* Delete Product Section - At the very end */}
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
								onClick={() => {
									if (editingProductId) {
										// Find the product to delete
										const product = displayProducts.find(
											(p) => p.id === editingProductId,
										);
										if (product) {
											handleDeleteClick(product);
										}
									}
								}}
								className="mt-2 w-fit"
							>
								<Trash2 className="w-4 h-4" />
								<span>Удалить товар</span>
							</Button>
						</div>
					</DrawerSection>
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
									error={
										hasAttemptedSubmit && !formData.name
											? "обязательно"
											: undefined
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
									error={
										hasAttemptedSubmit && !formData.slug
											? "обязательно"
											: undefined
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
											error={
												hasAttemptedSubmit && !formData.price
													? "обязательно"
													: undefined
											}
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
												error={
													hasAttemptedSubmit && !formData.categorySlug
														? "обязательно"
														: undefined
												}
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
							</div>{" "}
							{/* Close grid-cols-1 gap-4 */}
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
