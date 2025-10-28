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
import { getProductBySlug } from "~/server_functions/dashboard/store/getProductBySlug";

export function usePrefetch() {
	const queryClient = useQueryClient();

	/**
	 * Prefetch a single product by slug (for store product pages)
	 * Use on product card hover
	 */
	const prefetchProduct = (productSlug: string) => {
		queryClient.prefetchQuery(productQueryOptions(productSlug));
	};

	/**
	 * Prefetch dashboard product details by ID (for edit drawer)
	 * Use on dashboard product card hover
	 */
	const prefetchDashboardProduct = (productId: number) => {
		queryClient.prefetchQuery({
			queryKey: ["bfloorDashboardProduct", productId],
			queryFn: () => getProductBySlug({ data: { id: productId } }),
			staleTime: 1000 * 60 * 5, // 5 minutes
		});
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
		prefetchDashboardProduct,
		prefetchStore,
		prefetchDashboardOrders,
	};
}
