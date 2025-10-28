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
import { getAllOrders } from "~/server_functions/dashboard/orders/getAllOrders";
import { getAllProducts } from "~/server_functions/dashboard/store/getAllProducts";
import { getStoreData } from "~/server_functions/store/getAllProducts";
import { getProductBySlug } from "~/server_functions/store/getProductBySlug";
import { getAllBrands } from "~/server_functions/dashboard/getAllBrands";
import { getAllCollections } from "~/server_functions/dashboard/collections/getAllCollections";
import { getAllProductCategories } from "~/server_functions/dashboard/categories/getAllProductCategories";
import { getAllStoreLocations } from "~/server_functions/dashboard/storeLocations/getAllStoreLocations";

/**
 * Store data query options (DEPRECATED - use storeDataInfiniteQueryOptions)
 * Used for: legacy /store route
 *
 * Cache Strategy: Maximum caching
 * - Data cached in memory for 7 days
 * - Only refetches on manual invalidation or after 24 hours
 */
export const storeDataQueryOptions = () =>
	queryOptions({
		queryKey: ["bfloorStoreData"],
		queryFn: async () => getStoreData(),
		staleTime: 1000 * 60 * 60 * 24, // 24 hours - data considered fresh
		gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days - keep in memory
		retry: 3,
		refetchOnWindowFocus: false, // Don't refetch on window focus
		refetchOnMount: false, // Don't refetch on component mount if data is fresh
	});

/**
 * Store data infinite query options
 * Used for: /store route with virtualized infinite scroll
 *
 * Cache Strategy: Optimized for infinite scrolling
 * - Each page cached for 12 hours
 * - Infinite query with 50 products per page
 * - Perfect for virtualizer implementation
 */
export const storeDataInfiniteQueryOptions = () => infiniteQueryOptions({
	queryKey: ["bfloorStoreDataInfinite"],
	queryFn: ({ pageParam = 1 }) => getStoreData({ data: { page: pageParam as number, limit: 50 } }),
	staleTime: 0, // No cache - always fetch fresh data (same as dashboard)
	initialPageParam: 1,
	getNextPageParam: (lastPage: any) => {
		// Simple: return next page number if there's a next page
		return lastPage?.pagination?.hasNextPage 
			? lastPage.pagination.page + 1 
			: undefined;
	},
	getPreviousPageParam: (firstPage: any) => {
		// Simple: return previous page number if there's a previous page
		return firstPage?.pagination?.hasPreviousPage 
			? firstPage.pagination.page - 1 
			: undefined;
	},
});

/**
 * Product by slug query options
 * Used for: /store/$productId route and prefetching individual products
 *
 * Cache Strategy: Long-lived caching
 * - Individual products cached for 24 hours
 * - Cached in memory across page refreshes
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
		staleTime: 1000 * 60 * 60 * 24, // 24 hours - data considered fresh
		gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days - keep in memory
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});

/**
 * Dashboard orders query options
 * Used for: /dashboard/orders route
 *
 * Cache Strategy: Short-lived caching for fresh data
 * - Orders cached for 5 minutes (more dynamic than products)
 * - Refetches on window focus to show latest orders
 * - Manual invalidation after order status updates
 */
export const dashboardOrdersQueryOptions = () =>
	queryOptions({
		queryKey: ["bfloorDashboardOrders"],
		queryFn: async () => getAllOrders(),
		staleTime: 1000 * 60 * 5, // 5 minutes - orders are more dynamic
		gcTime: 1000 * 60 * 30, // 30 minutes - keep in memory
		retry: 3,
		refetchOnWindowFocus: true, // Refetch when returning to dashboard
		refetchOnMount: false,
		refetchOnReconnect: true,
	});

/**
 * Dashboard products infinite query options
 * Used for: /dashboard route with virtualized product grid
 *
 * Cache Strategy: Optimized for infinite scrolling
 * - Each page cached for 10 minutes
 * - Infinite query with 20 products per page
 * - Perfect for virtualizer implementation
 * - Background refetching for fresh data
 */
export const productsInfiniteQueryOptions = () => infiniteQueryOptions({
	queryKey: ["bfloorDashboardProductsInfinite"],
	queryFn: ({ pageParam = 1 }) => getAllProducts({ data: { page: pageParam as number, limit: 50 } }),
	staleTime: 0, // No cache - force fresh data for dashboard
	initialPageParam: 1,
	getNextPageParam: (lastPage: any) => {
		// Simple and clean: if there's a next page, return next page number
		return lastPage?.pagination?.hasNextPage 
			? lastPage.pagination.page + 1 
			: undefined;
	},
	getPreviousPageParam: (firstPage: any) => {
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
					limit: pageSize 
				} 
			});
		},
		initialPageParam: 1,
		getNextPageParam: (lastPage: any) => {
			try {
				// Completely defensive - check absolutely everything
				if (!lastPage || typeof lastPage !== 'object') return undefined;
				if (!lastPage.pagination || typeof lastPage.pagination !== 'object') return undefined;
				if (lastPage.pagination.hasNextPage !== true) return undefined;
				if (typeof lastPage.pagination.page !== 'number') return undefined;
				return lastPage.pagination.page + 1;
			} catch {
				return undefined;
			}
		},
		getPreviousPageParam: (firstPage: any) => {
			try {
				// Completely defensive - check absolutely everything
				if (!firstPage || typeof firstPage !== 'object') return undefined;
				if (!firstPage.pagination || typeof firstPage.pagination !== 'object') return undefined;
				if (firstPage.pagination.hasPreviousPage !== true) return undefined;
				if (typeof firstPage.pagination.page !== 'number') return undefined;
				return firstPage.pagination.page - 1;
			} catch {
				return undefined;
			}
		},
		staleTime: 1000 * 60 * 60 * 12, // 12 hours - data considered fresh
		gcTime: 1000 * 60 * 60 * 24 * 3, // 3 days - keep in memory
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
 * Aggressive caching strategy: 3-day stale time, 7-day garbage collection
 */

/**
 * Brands query options
 * Used for: All routes that need brand data
 *
 * Cache Strategy: Maximum caching for static data
 * - Brands cached for 3 days (very static)
 * - Kept in memory for 7 days
 * - No automatic refetching
 */
export const brandsQueryOptions = () =>
	queryOptions({
		queryKey: ["bfloorBrands"],
		queryFn: async () => getAllBrands(),
		staleTime: 1000 * 60 * 60 * 24 * 3, // 3 days - brands rarely change
		gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days - keep in memory
		retry: 3,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});

/**
 * Collections query options
 * Used for: All routes that need collection data
 *
 * Cache Strategy: Maximum caching for static data
 * - Collections cached for 3 days (very static)
 * - Kept in memory for 7 days
 * - No automatic refetching
 */
export const collectionsQueryOptions = () =>
	queryOptions({
		queryKey: ["bfloorCollections"],
		queryFn: async () => getAllCollections(),
		staleTime: 1000 * 60 * 60 * 24 * 3, // 3 days - collections rarely change
		gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days - keep in memory
		retry: 3,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});

/**
 * Categories query options
 * Used for: All routes that need category data
 *
 * Cache Strategy: Maximum caching for static data
 * - Categories cached for 3 days (very static)
 * - Kept in memory for 7 days
 * - No automatic refetching
 */
export const categoriesQueryOptions = () =>
	queryOptions({
		queryKey: ["bfloorCategories"],
		queryFn: async () => getAllProductCategories(),
		staleTime: 1000 * 60 * 60 * 24 * 3, // 3 days - categories rarely change
		gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days - keep in memory
		retry: 3,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});

/**
 * Store Locations query options
 * Used for: All routes that need store location data
 *
 * Cache Strategy: Maximum caching for static data
 * - Store locations cached for 3 days (very static)
 * - Kept in memory for 7 days
 * - No automatic refetching
 */
export const storeLocationsQueryOptions = () =>
	queryOptions({
		queryKey: ["bfloorStoreLocations"],
		queryFn: async () => getAllStoreLocations(),
		staleTime: 1000 * 60 * 60 * 24 * 3, // 3 days - store locations rarely change
		gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days - keep in memory
		retry: 3,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});
