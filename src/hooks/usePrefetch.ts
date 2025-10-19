/**
 * Prefetch Hook
 *
 * Provides utilities for prefetching data on hover/intent.
 * This improves perceived performance by loading data before navigation.
 */

import { useQueryClient } from "@tanstack/react-query";
import {
	dashboardOrdersQueryOptions,
	productQueryOptions,
	storeDataQueryOptions,
} from "~/lib/queryOptions";

export function usePrefetch() {
	const queryClient = useQueryClient();

	/**
	 * Prefetch a single product by slug
	 * Use on product card hover
	 */
	const prefetchProduct = (productSlug: string) => {
		queryClient.prefetchQuery(productQueryOptions(productSlug));
	};

	/**
	 * Prefetch store data (all products, categories)
	 * Use on homepage store link hover
	 */
	const prefetchStore = () => {
		queryClient.prefetchQuery(storeDataQueryOptions());
	};

	/**
	 * Prefetch dashboard orders
	 * Use on dashboard navigation link hover
	 */
	const prefetchDashboardOrders = () => {
		queryClient.prefetchQuery(dashboardOrdersQueryOptions());
	};

	return {
		prefetchProduct,
		prefetchStore,
		prefetchDashboardOrders,
	};
}
