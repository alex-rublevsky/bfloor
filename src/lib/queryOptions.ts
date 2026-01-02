/**
 * Query Options Factory
 *
 * Centralized query configuration for TanStack Query.
 * This ensures consistent caching, staleTime, and query keys across the app.
 *
 * Benefits:
 * - Single source of truth for query configuration
 * - Type-safe query options
 * - Easy to reuse in loaders, prefetching, and components
 * - Consistent cache keys prevent duplicate fetches
 */

import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";
import { getAllAttributeValuesByAttribute } from "~/server_functions/dashboard/attributes/getAllAttributeValuesByAttribute";
import { getAllProductAttributes } from "~/server_functions/dashboard/attributes/getAllProductAttributes";
import { getAttributeValues } from "~/server_functions/dashboard/attributes/getAttributeValues";
import { getProductBrandCounts } from "~/server_functions/dashboard/brands/getProductBrandCounts";
import { getAllProductCategories } from "~/server_functions/dashboard/categories/getAllProductCategories";
import { getAllCollections } from "~/server_functions/dashboard/collections/getAllCollections";
import { getProductCollectionCounts } from "~/server_functions/dashboard/collections/getProductCollectionCounts";
import { getAllCountriesForDashboard } from "~/server_functions/dashboard/countries/getAllCountries";
import { getAllBrands } from "~/server_functions/dashboard/getAllBrands";
import { getTotalAttributesCount } from "~/server_functions/dashboard/getTotalAttributesCount";
import { getTotalBrandsCount } from "~/server_functions/dashboard/getTotalBrandsCount";
import { getTotalCategoriesCount } from "~/server_functions/dashboard/getTotalCategoriesCount";
import { getTotalCollectionsCount } from "~/server_functions/dashboard/getTotalCollectionsCount";
import { getTotalOrdersCount } from "~/server_functions/dashboard/getTotalOrdersCount";
import { getTotalProductsCount } from "~/server_functions/dashboard/getTotalProductsCount";
import { getTotalStoreLocationsCount } from "~/server_functions/dashboard/getTotalStoreLocationsCount";
import { getAllOrders } from "~/server_functions/dashboard/orders/getAllOrders";
import { getAllProducts } from "~/server_functions/dashboard/store/getAllProducts";
import { getAllStoreLocations } from "~/server_functions/dashboard/storeLocations/getAllStoreLocations";
import { getStoreData } from "~/server_functions/store/getAllProducts";
import { getAttributeValuesForFiltering } from "~/server_functions/store/getAttributeValuesForFiltering";
import { getProductBySlug } from "~/server_functions/store/getProductBySlug";
import { getRecommendedProducts } from "~/server_functions/store/getRecommendedProducts";
import { getUserData } from "~/utils/auth-server-func";

/**
 * Store data query options (DEPRECATED - use storeDataInfiniteQueryOptions)
 * Used for: legacy /store route
 *
 * Cache Strategy: Aggressive caching
 * - Data cached in memory for 3 days
 * - Kept in memory for 7 days
 * - Only refetches on manual invalidation or after 3 days
 */
export const storeDataQueryOptions = () =>
	queryOptions({
		queryKey: ["bfloorStoreData"],
		queryFn: async () => getStoreData(),
		staleTime: 1000 * 60 * 60 * 24 * 3, // 3 days - data considered fresh
		gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days - keep in memory
		retry: 3,
		refetchOnWindowFocus: false, // Don't refetch on window focus
		refetchOnMount: false, // Don't refetch on component mount if data is fresh
	});

// Type for paginated response from getStoreData and getAllProducts
type PaginatedResponse = {
	products: unknown[];
	pagination?: {
		page: number;
		limit: number;
		totalCount: number;
		totalPages: number;
		hasNextPage: boolean;
		hasPreviousPage: boolean;
	};
};

/**
 * Store data infinite query options
 * Used for: /store route with virtualized infinite scroll
 *
 * Cache Strategy: Optimized for infinite scrolling with aggressive caching
 * - Each page cached per filter combination for 3 days
 * - Infinite query with 50 products per page
 * - Perfect for virtualizer implementation
 * - Server-side filtering (same as dashboard)
 */
export const storeDataInfiniteQueryOptions = (
	search?: string,
	filters?: {
		categorySlug?: string | null;
		brandSlug?: string | null;
		collectionSlug?: string | null;
		attributeFilters?: Record<number, string[]>; // attributeId -> array of value IDs
		sort?:
			| "relevant"
			| "name"
			| "price-asc"
			| "price-desc"
			| "newest"
			| "oldest";
	},
) =>
	infiniteQueryOptions({
		queryKey: [
			"bfloorStoreDataInfinite",
			{
				search: search ?? "",
				categorySlug: filters?.categorySlug ?? null,
				brandSlug: filters?.brandSlug ?? null,
				collectionSlug: filters?.collectionSlug ?? null,
				attributeFilters: filters?.attributeFilters ?? {},
				sort: filters?.sort ?? "relevant",
			},
		],
		queryFn: ({ pageParam = 1 }) =>
			getStoreData({
				data: {
					page: pageParam as number,
					limit: 50,
					search,
					categorySlug: filters?.categorySlug ?? undefined,
					brandSlug: filters?.brandSlug ?? undefined,
					collectionSlug: filters?.collectionSlug ?? undefined,
					attributeFilters: filters?.attributeFilters ?? undefined,
					sort: filters?.sort ?? undefined,
				},
			}),
		staleTime: 1000 * 60 * 60 * 24 * 3, // 3 days - products cached aggressively
		gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days - keep in memory
		initialPageParam: 1,
		getNextPageParam: (lastPage: PaginatedResponse) => {
			// Simple: return next page number if there's a next page
			return lastPage?.pagination?.hasNextPage
				? lastPage.pagination.page + 1
				: undefined;
		},
		getPreviousPageParam: (firstPage: PaginatedResponse) => {
			// Simple: return previous page number if there's a previous page
			return firstPage?.pagination?.hasPreviousPage
				? firstPage.pagination.page - 1
				: undefined;
		},
	});

/**
 * Attribute values for filtering query options
 * Used for: Store and dashboard pages to show available attribute filter options
 *
 * Cache Strategy: Moderate caching for dynamic data
 * - Attribute values cached for 1 hour (changes based on current filters)
 * - Kept in memory for 3 hours
 * - Query key includes attributeFilters so cache invalidates when filters change
 */
export const attributeValuesForFilteringQueryOptions = (
	categorySlug?: string,
	brandSlug?: string,
	collectionSlug?: string,
	attributeFilters?: Record<number, string[]>,
) =>
	queryOptions({
		queryKey: [
			"attributeValuesForFiltering",
			{
				categorySlug: categorySlug ?? null,
				brandSlug: brandSlug ?? null,
				collectionSlug: collectionSlug ?? null,
				attributeFilters: attributeFilters ?? {},
			},
		],
		queryFn: async () =>
			getAttributeValuesForFiltering({
				data: {
					categorySlug,
					brandSlug,
					collectionSlug,
					attributeFilters: attributeFilters ?? undefined,
				},
			}),
		staleTime: 1000 * 60 * 60, // 1 hour - values change based on filters
		gcTime: 1000 * 60 * 60 * 3, // 3 hours - keep in memory
		retry: 3,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});

/**
 * Product by slug query options
 * Used for: /store/$productId route and prefetching individual products
 *
 * Cache Strategy: Aggressive caching for individual products
 * - Individual products cached for 3 days
 * - Cached in memory for 7 days
 * - Perfect for product detail pages
 */
export const productQueryOptions = (productId: string) =>
	queryOptions({
		queryKey: ["bfloorProduct", productId],
		queryFn: async () => {
			try {
				return await getProductBySlug({ data: productId });
			} catch (error) {
				if (error instanceof Error && error.message === "Product not found") {
					throw notFound();
				}
				throw error;
			}
		},
		retry: false, // Don't retry on error - fail fast for 404s
		staleTime: 1000 * 60 * 60 * 24 * 3, // 3 days - products cached aggressively
		gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days - keep in memory
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});

/**
 * Dashboard orders query options
 * Used for: /dashboard/orders route
 *
 * Cache Strategy: Moderate caching for dynamic data
 * - Orders cached for 1 day (more dynamic than products but still cacheable)
 * - Kept in memory for 3 days
 * - Refetches on window focus to show latest orders
 * - Manual invalidation after order status updates
 */
export const dashboardOrdersQueryOptions = () =>
	queryOptions({
		queryKey: ["bfloorDashboardOrders"],
		queryFn: async () => getAllOrders(),
		staleTime: 1000 * 60 * 60 * 24, // 1 day - orders are dynamic but cacheable
		gcTime: 1000 * 60 * 60 * 24 * 3, // 3 days - keep in memory
		retry: 3,
		refetchOnWindowFocus: true, // Refetch when returning to dashboard
		refetchOnMount: false,
		refetchOnReconnect: true,
	});

/**
 * Dashboard products infinite query options
 * Used for: /dashboard route with virtualized product grid
 *
 * Cache Strategy: Optimized for infinite scrolling with aggressive caching
 * - Each page cached for 3 days
 * - Infinite query with 20 products per page
 * - Perfect for virtualizer implementation
 * - Background refetching for fresh data
 */
export const productsInfiniteQueryOptions = (
	search?: string,
	filters?: {
		categorySlug?: string | null;
		brandSlug?: string | null;
		collectionSlug?: string | null;
		attributeFilters?: Record<number, string[]>; // attributeId -> array of value IDs
		uncategorizedOnly?: boolean;
		withoutBrandOnly?: boolean;
		withoutCollectionOnly?: boolean;
		sort?:
			| "relevant"
			| "name"
			| "price-asc"
			| "price-desc"
			| "newest"
			| "oldest";
	},
) =>
	infiniteQueryOptions({
		queryKey: [
			"bfloorDashboardProductsInfinite",
			{
				search: search ?? "",
				categorySlug: filters?.categorySlug ?? null,
				brandSlug: filters?.brandSlug ?? null,
				collectionSlug: filters?.collectionSlug ?? null,
				attributeFilters: filters?.attributeFilters ?? {},
				uncategorizedOnly: filters?.uncategorizedOnly ?? false,
				withoutBrandOnly: filters?.withoutBrandOnly ?? false,
				withoutCollectionOnly: filters?.withoutCollectionOnly ?? false,
				sort: filters?.sort ?? "relevant",
			},
		],
		queryFn: ({ pageParam = 1 }) =>
			getAllProducts({
				data: {
					page: pageParam as number,
					limit: 50,
					search,
					categorySlug: filters?.categorySlug ?? undefined,
					brandSlug: filters?.brandSlug ?? undefined,
					collectionSlug: filters?.collectionSlug ?? undefined,
					attributeFilters: filters?.attributeFilters ?? undefined,
					uncategorizedOnly: filters?.uncategorizedOnly ?? undefined,
					withoutBrandOnly: filters?.withoutBrandOnly ?? undefined,
					withoutCollectionOnly: filters?.withoutCollectionOnly ?? undefined,
					sort: filters?.sort ?? undefined,
				},
			}),
		staleTime: 1000 * 60 * 60 * 24 * 3, // 3 days - products cached aggressively
		gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days - keep in memory
		// Note: Query will be manually invalidated via refetch() after product updates
		initialPageParam: 1,
		getNextPageParam: (lastPage: PaginatedResponse) => {
			// Simple and clean: if there's a next page, return next page number
			return lastPage?.pagination?.hasNextPage
				? lastPage.pagination.page + 1
				: undefined;
		},
		getPreviousPageParam: (firstPage: PaginatedResponse) => {
			// Simple and clean: if there's a previous page, return previous page number
			return firstPage?.pagination?.hasPreviousPage
				? firstPage.pagination.page - 1
				: undefined;
		},
	});

export const dashboardProductsInfiniteQueryOptions = (pageSize: number = 20) =>
	infiniteQueryOptions({
		queryKey: ["bfloorDashboardProductsInfinite", pageSize],
		queryFn: async ({ pageParam = 1 }) => {
			return await getAllProducts({
				data: {
					page: pageParam as number,
					limit: pageSize,
				},
			});
		},
		initialPageParam: 1,
		getNextPageParam: (lastPage: PaginatedResponse) => {
			try {
				// Completely defensive - check absolutely everything
				if (!lastPage || typeof lastPage !== "object") return undefined;
				if (!lastPage.pagination || typeof lastPage.pagination !== "object")
					return undefined;
				if (lastPage.pagination.hasNextPage !== true) return undefined;
				if (typeof lastPage.pagination.page !== "number") return undefined;
				return lastPage.pagination.page + 1;
			} catch {
				return undefined;
			}
		},
		getPreviousPageParam: (firstPage: PaginatedResponse) => {
			try {
				// Completely defensive - check absolutely everything
				if (!firstPage || typeof firstPage !== "object") return undefined;
				if (!firstPage.pagination || typeof firstPage.pagination !== "object")
					return undefined;
				if (firstPage.pagination.hasPreviousPage !== true) return undefined;
				if (typeof firstPage.pagination.page !== "number") return undefined;
				return firstPage.pagination.page - 1;
			} catch {
				return undefined;
			}
		},
		staleTime: 1000 * 60 * 60 * 24 * 3, // 3 days - products cached aggressively
		gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days - keep in memory
		retry: 3,
		refetchOnWindowFocus: false, // Don't refetch on window focus for better UX
		refetchOnMount: false,
		maxPages: 10, // Limit to prevent memory issues
	});

/**
 * =============================================================================
 * REFERENCE DATA QUERIES (Brands, Collections, Categories, Store Locations)
 * =============================================================================
 * These are static/semi-static data that rarely change.
 * Aggressive caching strategy: 7-day stale time, 14-day garbage collection
 */

/**
 * Brands query options
 * Used for: All routes that need brand data
 *
 * Cache Strategy: Maximum caching for static data
 * - Brands cached for 7 days (very static)
 * - Kept in memory for 14 days
 * - No automatic refetching
 */
export const brandsQueryOptions = () =>
	queryOptions({
		queryKey: ["bfloorBrands"],
		queryFn: async () => getAllBrands(),
		staleTime: 1000 * 60 * 60 * 24 * 7, // 7 days - brands rarely change
		gcTime: 1000 * 60 * 60 * 24 * 14, // 14 days - keep in memory
		retry: 3,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});

/**
 * Collections query options
 * Used for: All routes that need collection data
 *
 * Cache Strategy: Maximum caching for static data
 * - Collections cached for 7 days (very static)
 * - Kept in memory for 14 days
 * - No automatic refetching
 */
export const collectionsQueryOptions = () =>
	queryOptions({
		queryKey: ["bfloorCollections"],
		queryFn: async () => getAllCollections(),
		staleTime: 1000 * 60 * 60 * 24 * 7, // 7 days - collections rarely change
		gcTime: 1000 * 60 * 60 * 24 * 14, // 14 days - keep in memory
		retry: 3,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});

/**
 * Categories query options
 * Used for: All routes that need category data
 *
 * Cache Strategy: Maximum caching for static data
 * - Categories cached for 7 days (very static)
 * - Kept in memory for 14 days
 * - No automatic refetching
 */
export const categoriesQueryOptions = () =>
	queryOptions({
		queryKey: ["bfloorCategories"],
		queryFn: async () => getAllProductCategories(),
		staleTime: 1000 * 60 * 60 * 24 * 7, // 7 days - categories rarely change
		gcTime: 1000 * 60 * 60 * 24 * 14, // 14 days - keep in memory
		retry: 3,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});

/**
 * Store Locations query options
 * Used for: All routes that need store location data
 *
 * Cache Strategy: Maximum caching for static data
 * - Store locations cached for 7 days (very static)
 * - Kept in memory for 14 days
 * - No automatic refetching
 */
export const storeLocationsQueryOptions = () =>
	queryOptions({
		queryKey: ["bfloorStoreLocations"],
		queryFn: async () => getAllStoreLocations(),
		staleTime: 1000 * 60 * 60 * 24 * 7, // 7 days - store locations rarely change
		gcTime: 1000 * 60 * 60 * 24 * 14, // 14 days - keep in memory
		retry: 3,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});

/**
 * Countries query options
 * Used for: Dashboard routes that need country data
 *
 * Cache Strategy: Maximum caching for static data
 * - Countries cached for 7 days (very static)
 * - Kept in memory for 14 days
 * - No automatic refetching
 */
export const countriesQueryOptions = () =>
	queryOptions({
		queryKey: ["bfloorCountries"],
		queryFn: async () => getAllCountriesForDashboard(),
		staleTime: 1000 * 60 * 60 * 24 * 7, // 7 days - countries rarely change
		gcTime: 1000 * 60 * 60 * 24 * 14, // 14 days - keep in memory
		retry: 3,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});

/**
 * Product Attributes query options (without counts - fast)
 * Used for: All routes that need attribute data
 *
 * Cache Strategy: Maximum caching for static data
 * - Attributes cached for 7 days (very static)
 * - Kept in memory for 14 days
 * - No automatic refetching
 */
export const productAttributesQueryOptions = () =>
	queryOptions({
		queryKey: ["productAttributes"],
		queryFn: async () => getAllProductAttributes(),
		staleTime: 1000 * 60 * 60 * 24 * 7, // 7 days - attributes rarely change
		gcTime: 1000 * 60 * 60 * 24 * 14, // 14 days - keep in memory
		retry: 3,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});

/**
 * Product Brand Counts query options (uses SQL COUNT - efficient)
 * Used for: /dashboard/brands route for streaming counts
 *
 * Cache Strategy: Aggressive caching for counts
 * - Counts cached for 2 weeks (counts change when products change, but still relatively static)
 * - Kept in memory for 24 days (max safe 32-bit timeout value)
 * - No automatic refetching
 */
export const productBrandCountsQueryOptions = () =>
	queryOptions({
		queryKey: ["productBrandCounts"],
		queryFn: async () => getProductBrandCounts(),
		staleTime: 1000 * 60 * 60 * 24 * 14, // 2 weeks - counts are relatively static
		gcTime: 1000 * 60 * 60 * 24 * 24, // 24 days - keep in memory (max safe 32-bit value)
		retry: 3,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});

/**
 * Product Collection Counts query options (uses SQL COUNT - efficient)
 * Used for: /dashboard/collections route for streaming counts
 *
 * Cache Strategy: Aggressive caching for counts
 * - Counts cached for 2 weeks (counts change when products change, but still relatively static)
 * - Kept in memory for 24 days (max safe 32-bit timeout value)
 * - No automatic refetching
 */
export const productCollectionCountsQueryOptions = () =>
	queryOptions({
		queryKey: ["productCollectionCounts"],
		queryFn: async () => getProductCollectionCounts(),
		staleTime: 1000 * 60 * 60 * 24 * 14, // 2 weeks - counts are relatively static
		gcTime: 1000 * 60 * 60 * 24 * 24, // 24 days - keep in memory (max safe 32-bit value)
		retry: 3,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});

/**
 * All attribute values grouped by attribute ID query options
 * Used for: Attributes dashboard page to show standardized values
 *
 * Cache Strategy: Aggressive caching for semi-static data
 * - Attribute values cached for 7 days (more dynamic than attributes but still cacheable)
 * - Kept in memory for 14 days
 */
export const allAttributeValuesByAttributeQueryOptions = () =>
	queryOptions({
		queryKey: ["attributeValuesByAttribute"],
		queryFn: async () => getAllAttributeValuesByAttribute(),
		staleTime: 1000 * 60 * 60 * 24 * 7, // 7 days - values change but still cacheable
		gcTime: 1000 * 60 * 60 * 24 * 14, // 14 days - keep in memory
		retry: 3,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});

/**
 * Attribute values for a specific attribute query options
 * Used for: Editing attribute values in the attribute form
 *
 * Cache Strategy: Short caching for form data (but increased gcTime)
 * - Values cached for 5 minutes (fresh for editing)
 * - Kept in memory for 1 day (for quick access)
 */
export const attributeValuesQueryOptions = (attributeId: number) =>
	queryOptions({
		queryKey: ["attributeValues", attributeId],
		queryFn: async () => getAttributeValues({ data: { attributeId } }),
		staleTime: 1000 * 60 * 5, // 5 minutes - fresh for editing
		gcTime: 1000 * 60 * 60 * 24, // 1 day - keep in memory for quick access
		retry: 3,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});

/**
 * Products by tag query options
 * Used for: ProductSlider component on home page
 *
 * Cache Strategy: Extremely aggressive caching
 * - Products by tag cached for 7 days (extremely cached)
 * - Kept in memory for 14 days
 * - No automatic refetching
 * - Perfect for prefetching all tags on mount
 */
export const productsByTagQueryOptions = (tag: string) =>
	queryOptions({
		queryKey: ["bfloorProductsByTag", tag],
		queryFn: async () =>
			getAllProducts({
				data: {
					tag,
					sort: "name",
				},
			}),
		staleTime: 1000 * 60 * 60 * 24 * 7, // 7 days - extremely cached
		gcTime: 1000 * 60 * 60 * 24 * 14, // 14 days - keep in memory
		retry: 3,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});

/**
 * Discounted products query options
 * Used for: ProductSlider component (simple mode) on home page
 *
 * Cache Strategy: Extremely aggressive caching
 * - Discounted products cached for 7 days (extremely cached)
 * - Kept in memory for 14 days
 * - No automatic refetching
 * - Perfect for home page carousel
 */
export const discountedProductsQueryOptions = () =>
	queryOptions({
		queryKey: ["bfloorDiscountedProducts"],
		queryFn: async () =>
			getAllProducts({
				data: {
					hasDiscount: true,
					sort: "name",
				},
			}),
		staleTime: 1000 * 60 * 60 * 24 * 7, // 7 days - extremely cached
		gcTime: 1000 * 60 * 60 * 24 * 14, // 14 days - keep in memory
		retry: 3,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});

/**
 * Products by tag infinite query options
 * Used for: ProductSlider component with pagination and infinite scrolling
 *
 * Cache Strategy: Optimized for infinite scrolling with aggressive caching
 * - Each page cached for 3 days
 * - Infinite query with 20 products per page
 * - Perfect for carousel implementation with progressive loading
 */
export const productsByTagInfiniteQueryOptions = (tag: string) =>
	infiniteQueryOptions({
		queryKey: ["bfloorProductsByTagInfinite", tag],
		queryFn: ({ pageParam = 1 }) =>
			getAllProducts({
				data: {
					tag,
					page: pageParam as number,
					limit: 20, // Smaller page size for carousel
					sort: "name",
				},
			}),
		staleTime: 1000 * 60 * 60 * 24 * 3, // 3 days - products cached aggressively
		gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days - keep in memory
		retry: 3,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
		initialPageParam: 1,
		getNextPageParam: (lastPage: PaginatedResponse) => {
			return lastPage?.pagination?.hasNextPage
				? lastPage.pagination.page + 1
				: undefined;
		},
		getPreviousPageParam: (firstPage: PaginatedResponse) => {
			return firstPage?.pagination?.hasPreviousPage
				? firstPage.pagination.page - 1
				: undefined;
		},
	});

/**
 * =============================================================================
 * TOTAL COUNT QUERIES (for navigation/search placeholders)
 * =============================================================================
 * These are efficient COUNT queries used in navigation/search placeholders
 * that are visible on all pages. Using SQL COUNT instead of fetching all records.
 * Aggressive caching: 3-7 days stale time, 7-14 days garbage collection
 */

/**
 * Total products count query options
 * Used for: Navigation/search placeholder on dashboard and store pages
 *
 * Cache Strategy: Aggressive caching for counts
 * - Count cached for 3 days (products change but counts are relatively static)
 * - Kept in memory for 7 days
 */
export const totalProductsCountQueryOptions = () =>
	queryOptions({
		queryKey: ["totalProductsCount"],
		queryFn: async () => getTotalProductsCount(),
		staleTime: 1000 * 60 * 60 * 24 * 3, // 3 days - counts are relatively static
		gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days - keep in memory
		retry: 3,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});

/**
 * Total categories count query options
 * Used for: Navigation/search placeholder on categories page
 *
 * Cache Strategy: Aggressive caching for counts
 * - Count cached for 7 days (categories are very static)
 * - Kept in memory for 14 days
 */
export const totalCategoriesCountQueryOptions = () =>
	queryOptions({
		queryKey: ["totalCategoriesCount"],
		queryFn: async () => getTotalCategoriesCount(),
		staleTime: 1000 * 60 * 60 * 24 * 7, // 7 days - categories are very static
		gcTime: 1000 * 60 * 60 * 24 * 14, // 14 days - keep in memory
		retry: 3,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});

/**
 * Total brands count query options
 * Used for: Navigation/search placeholder on brands page
 *
 * Cache Strategy: Aggressive caching for counts
 * - Count cached for 7 days (brands are very static)
 * - Kept in memory for 14 days
 */
export const totalBrandsCountQueryOptions = () =>
	queryOptions({
		queryKey: ["totalBrandsCount"],
		queryFn: async () => getTotalBrandsCount(),
		staleTime: 1000 * 60 * 60 * 24 * 7, // 7 days - brands are very static
		gcTime: 1000 * 60 * 60 * 24 * 14, // 14 days - keep in memory
		retry: 3,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});

/**
 * Total collections count query options
 * Used for: Navigation/search placeholder on collections page
 *
 * Cache Strategy: Aggressive caching for counts
 * - Count cached for 7 days (collections are very static)
 * - Kept in memory for 14 days
 */
export const totalCollectionsCountQueryOptions = () =>
	queryOptions({
		queryKey: ["totalCollectionsCount"],
		queryFn: async () => getTotalCollectionsCount(),
		staleTime: 1000 * 60 * 60 * 24 * 7, // 7 days - collections are very static
		gcTime: 1000 * 60 * 60 * 24 * 14, // 14 days - keep in memory
		retry: 3,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});

/**
 * Total orders count query options
 * Used for: Navigation/search placeholder on orders page
 *
 * Cache Strategy: Moderate caching for dynamic data
 * - Count cached for 1 day (orders are dynamic but counts are cacheable)
 * - Kept in memory for 3 days
 */
export const totalOrdersCountQueryOptions = () =>
	queryOptions({
		queryKey: ["totalOrdersCount"],
		queryFn: async () => getTotalOrdersCount(),
		staleTime: 1000 * 60 * 60 * 24, // 1 day - orders are dynamic but counts cacheable
		gcTime: 1000 * 60 * 60 * 24 * 3, // 3 days - keep in memory
		retry: 3,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});

/**
 * Total attributes count query options
 * Used for: Navigation/search placeholder on attributes page
 *
 * Cache Strategy: Aggressive caching for counts
 * - Count cached for 7 days (attributes are very static)
 * - Kept in memory for 14 days
 */
export const totalAttributesCountQueryOptions = () =>
	queryOptions({
		queryKey: ["totalAttributesCount"],
		queryFn: async () => getTotalAttributesCount(),
		staleTime: 1000 * 60 * 60 * 24 * 7, // 7 days - attributes are very static
		gcTime: 1000 * 60 * 60 * 24 * 14, // 14 days - keep in memory
		retry: 3,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});

/**
 * Total store locations count query options
 * Used for: Navigation/search placeholder on misc page
 *
 * Cache Strategy: Aggressive caching for counts
 * - Count cached for 7 days (store locations are very static)
 * - Kept in memory for 14 days
 */
export const totalStoreLocationsCountQueryOptions = () =>
	queryOptions({
		queryKey: ["totalStoreLocationsCount"],
		queryFn: async () => getTotalStoreLocationsCount(),
		staleTime: 1000 * 60 * 60 * 24 * 7, // 7 days - store locations are very static
		gcTime: 1000 * 60 * 60 * 24 * 14, // 14 days - keep in memory
		retry: 3,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});

/**
 * Discounted products infinite query options
 * Used for: ProductSlider component (simple mode) with pagination and infinite scrolling
 *
 * Cache Strategy: Optimized for infinite scrolling with aggressive caching
 * - Each page cached for 3 days
 * - Infinite query with 20 products per page
 * - Perfect for carousel implementation with progressive loading
 */
export const discountedProductsInfiniteQueryOptions = () =>
	infiniteQueryOptions({
		queryKey: ["bfloorDiscountedProductsInfinite"],
		queryFn: ({ pageParam = 1 }) =>
			getAllProducts({
				data: {
					hasDiscount: true,
					page: pageParam as number,
					limit: 20,
					sort: "name",
				},
			}),
		staleTime: 1000 * 60 * 60 * 24 * 3, // 3 days - products cached aggressively
		gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days - keep in memory
		retry: 3,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
		initialPageParam: 1,
		getNextPageParam: (lastPage: PaginatedResponse) => {
			return lastPage?.pagination?.hasNextPage
				? lastPage.pagination.page + 1
				: undefined;
		},
		getPreviousPageParam: (firstPage: PaginatedResponse) => {
			return firstPage?.pagination?.hasPreviousPage
				? firstPage.pagination.page - 1
				: undefined;
		},
	});

/**
 * Recommended products infinite query options
 * Used for: ProductSlider component (recommended mode) - shows featured products
 *
 * Cache Strategy: EXTREME caching for static-like data
 * - Each page cached for 30 days (recommended products change rarely)
 * - Infinite query with 20 products per page
 * - Perfect for carousel implementation with progressive loading
 * - Uses dedicated getRecommendedProducts server function (optimized for featured products)
 */
export const recommendedProductsInfiniteQueryOptions = () =>
	infiniteQueryOptions({
		queryKey: ["bfloorRecommendedProductsInfinite"],
		queryFn: ({ pageParam = 1 }) =>
			getRecommendedProducts({
				data: {
					page: pageParam as number,
					limit: 20,
				},
			}),
		staleTime: 1000 * 60 * 60 * 24 * 30, // 30 days - extreme caching for static-like data
		gcTime: 1000 * 60 * 60 * 24 * 60, // 60 days - keep in memory for a long time
		retry: 3,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
		refetchOnReconnect: false, // Don't refetch on reconnect (static data)
		initialPageParam: 1,
		getNextPageParam: (lastPage: PaginatedResponse) => {
			return lastPage?.pagination?.hasNextPage
				? lastPage.pagination.page + 1
				: undefined;
		},
		getPreviousPageParam: (firstPage: PaginatedResponse) => {
			return firstPage?.pagination?.hasPreviousPage
				? firstPage.pagination.page - 1
				: undefined;
		},
	});

/**
 * Recently visited products infinite query options
 * Used for: ProductSlider component (recommended mode) - shows recently visited products
 *
 * Cache Strategy: Short caching since this is user-specific data
 * - Each page cached for 5 minutes (user-specific, changes frequently)
 * - Infinite query with 20 products per page
 * - Perfect for carousel implementation with progressive loading
 */
export const recentlyVisitedProductsInfiniteQueryOptions = (
	productIds: number[],
) =>
	infiniteQueryOptions({
		queryKey: ["bfloorRecentlyVisitedProductsInfinite", productIds],
		queryFn: ({ pageParam = 1 }) =>
			getAllProducts({
				data: {
					productIds,
					page: pageParam as number,
					limit: 20,
					sort: "newest", // Show most recently visited first
				},
			}),
		staleTime: 1000 * 60 * 5, // 5 minutes - user-specific data changes frequently
		gcTime: 1000 * 60 * 60, // 1 hour - keep in memory
		retry: 3,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
		enabled: productIds.length > 0, // Only run if we have product IDs
		initialPageParam: 1,
		getNextPageParam: (lastPage: PaginatedResponse) => {
			return lastPage?.pagination?.hasNextPage
				? lastPage.pagination.page + 1
				: undefined;
		},
		getPreviousPageParam: (firstPage: PaginatedResponse) => {
			return firstPage?.pagination?.hasPreviousPage
				? firstPage.pagination.page - 1
				: undefined;
		},
	});

/**
 * User data query options
 * Used for: NavBar and any component that needs authenticated user data
 *
 * Cache Strategy: Moderate caching for user data
 * - User data cached for 5 minutes (fresh enough for UI, avoids excessive calls)
 * - Kept in memory for 1 hour
 * - Refetches on window focus to keep data fresh
 * - Only fetches when user is authenticated (handled by server function)
 */
export const userDataQueryOptions = () =>
	queryOptions({
		queryKey: ["userData"],
		queryFn: async () => {
			const data = await getUserData();
			// Return null if not authenticated to distinguish from loading state
			if (!data.isAuthenticated) {
				return null;
			}
			return {
				userID: data.userID || "",
				userName: data.userName || "",
				userEmail: data.userEmail || "",
				userAvatar: data.userAvatar || "",
				isAdmin: data.isAdmin || false,
			};
		},
		staleTime: 1000 * 60 * 60 * 24 * 7, // 7 days - user data is relatively stable
		gcTime: 1000 * 60 * 60 * 24 * 14, // 14 days - keep in memory
		retry: false, // Don't retry auth failures
		refetchOnWindowFocus: false, // Refetch when returning to app
		refetchOnMount: false, // Don't refetch on every mount if data is fresh
	});
