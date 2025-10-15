import { useSuspenseQuery } from "@tanstack/react-query";
import { getAllProducts } from "~/server_functions/dashboard/store/getAllProducts";
import type { ProductGroup } from "~/types";

// Memoized calculation function for total products and tea weight
const calculateProductStats = (productsData: {
	groupedProducts: ProductGroup[];
}) => {
	let totalProducts = 0;
	let totalTeaWeight = 0;

	// Single pass through all products
	for (const category of productsData.groupedProducts) {
		for (const product of category.products) {
			totalProducts++;

			// Check if product has tea categories (is a tea product)
			if (product.teaCategories && product.teaCategories.length > 0) {
				if (product.weight) {
					const weight = parseFloat(product.weight);
					if (!Number.isNaN(weight) && weight > 0) {
						totalTeaWeight += weight;
					}
				}
			}
		}
	}

	return {
		totalProducts,
		totalTeaWeight,
	};
};

/**
 * Custom hook that efficiently calculates total products count and tea weight
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
		totalTeaWeight: productStats.totalTeaWeight,
		isPending,
		error,
	};
}

