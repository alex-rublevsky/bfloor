import { useSuspenseQuery } from "@tanstack/react-query";
import { getAllProducts } from "~/server_functions/dashboard/store/getAllProducts";
import type { ProductGroup } from "~/types";

// Memoized calculation function for total products
const calculateProductStats = (productsData: {
	groupedProducts: ProductGroup[];
}) => {
	let totalProducts = 0;

	// Single pass through all products
	for (const category of productsData.groupedProducts) {
		for (const product of category.products) {
			totalProducts++;
		}
	}

	return {
		totalProducts,
	};
};

/**
 * Custom hook that efficiently calculates total products count
 * using TanStack Query's select option to avoid additional database queries.
 *
 * The select function transforms the fetched product data to calculate
 * the stats on the client side, leveraging React Query's caching.
 */
export function useProductStats() {
	const {
		data: productStats,
		isPending,
		error,
	} = useSuspenseQuery({
		queryKey: ["dashboard-products"],
		queryFn: () => getAllProducts(),
		select: calculateProductStats, // Use the simplified calculation function
		staleTime: 1000 * 60 * 5, // Cache for 5 minutes (same as products query)
	});

	return {
		totalProducts: productStats.totalProducts,
		isPending,
		error,
	};
}

