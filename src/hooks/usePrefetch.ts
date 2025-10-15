/**
 * Prefetch Hook
 *
 * Provides utilities for prefetching data on hover/intent.
 * This improves perceived performance by loading data before navigation.
 */

import { useQueryClient } from "@tanstack/react-query";
import {
	blogPostQueryOptions,
	blogPostsQueryOptions,
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
	 * Prefetch store data (all products, categories, tea categories)
	 * Use on homepage store link hover
	 */
	const prefetchStore = () => {
		queryClient.prefetchQuery(storeDataQueryOptions());
	};

	/**
	 * Prefetch all blog posts
	 * Use on homepage blog link hover
	 */
	const prefetchBlog = () => {
		queryClient.prefetchQuery(blogPostsQueryOptions());
	};

	/**
	 * Prefetch a single blog post by slug
	 * Use on blog card hover
	 */
	const prefetchBlogPost = (slug: string) => {
		queryClient.prefetchQuery(blogPostQueryOptions(slug));
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
		prefetchBlog,
		prefetchBlogPost,
		prefetchDashboardOrders,
	};
}
