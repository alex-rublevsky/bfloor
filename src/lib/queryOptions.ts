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

import { queryOptions } from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";
import { getAllOrders } from "~/server_functions/dashboard/orders/getAllOrders";
import { getStoreData } from "~/server_functions/store/getAllProducts";
import { getProductBySlug } from "~/server_functions/store/getProductBySlug";

/**
 * Store data query options
 * Used for: /store route and prefetching store data
 *
 * Cache Strategy: Maximum caching with persist plugin
 * - Data persists in localStorage for 7 days
 * - Only refetches on manual invalidation or after 24 hours
 */
export const storeDataQueryOptions = () =>
	queryOptions({
		queryKey: ["bfloorStoreData"],
		queryFn: async () => getStoreData(),
		staleTime: 1000 * 60 * 60 * 24, // 24 hours - data considered fresh (reduced from 24 hours)
		gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days - keep in memory/persist
		retry: 3,
		refetchOnWindowFocus: false, // Don't refetch on window focus
		refetchOnMount: false, // Don't refetch on component mount if data is fresh
	});

/**
 * Product by slug query options
 * Used for: /store/$productId route and prefetching individual products
 *
 * Cache Strategy: Long-lived caching with persist plugin
 * - Individual products cached for 24 hours
 * - Persists across page refreshes
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
		gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days - keep in memory/persist
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
