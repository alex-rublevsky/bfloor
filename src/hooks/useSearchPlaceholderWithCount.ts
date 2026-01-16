import { useQuery } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { productCategoryCountsQueryOptions } from "~/lib/queryOptions";

/**
 * Hook that returns the total product count by summing all category counts
 *
 * This is efficient because:
 * - Category counts are already fetched for the navigation bar (visible on all pages)
 * - We just sum the existing cached data - no additional query needed
 * - The data is already in TanStack Query cache
 */
function useProductsCountFromCategories(): number {
	const { data: categoryCounts } = useQuery(
		productCategoryCountsQueryOptions(),
	);

	if (!categoryCounts) return 0;

	// Sum all category counts to get total product count
	return Object.values(categoryCounts).reduce((sum, count) => sum + count, 0);
}

/**
 * Hook that returns the appropriate search placeholder for the current route
 *
 * For products/dashboard routes: Shows count derived from category counts (already in cache)
 * For all other routes: Simple placeholder without count
 */
export function useSearchPlaceholderWithCount() {
	const pathname = useRouterState().location.pathname;
	const isDashboard = pathname.startsWith("/dashboard");

	// Always call the hook (React rules), but only use it for dashboard routes
	const productsCount = useProductsCountFromCategories();

	// For dashboard routes (which show products), derive count from category counts
	if (isDashboard) {
		return `Искать среди ${productsCount} товаров`;
	}

	// For all other routes (store, index, etc.)
	return "Я ищу...";
}
