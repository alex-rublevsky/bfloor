import { useQuery } from "@tanstack/react-query";
import {
	brandsQueryOptions,
	categoriesQueryOptions,
	collectionsQueryOptions,
	storeLocationsQueryOptions,
} from "~/lib/queryOptions";
import { getAllProductAttributes } from "~/server_functions/dashboard/attributes/getAllProductAttributes";
import { getAllOrders } from "~/server_functions/dashboard/orders/getAllOrders";
import { getAllProducts } from "~/server_functions/dashboard/store/getAllProducts";

/**
 * Hook to get products count
 */
export function useProductsCount() {
	const { data: productsData } = useQuery({
		queryKey: ["bfloorDashboardProducts"],
		queryFn: () => getAllProducts(),
		staleTime: 1000 * 60 * 5,
	});

	// Return total products count from pagination info or products array length
	if (productsData?.pagination?.totalCount) {
		return productsData.pagination.totalCount;
	}

	return productsData?.products?.length || 0;
}

/**
 * Hook to get categories count
 */
export function useCategoriesCount() {
	const { data: categories } = useQuery({
		...categoriesQueryOptions(),
	});

	return categories?.length || 0;
}

/**
 * Hook to get brands count
 */
export function useBrandsCount() {
	const { data: brands } = useQuery({
		...brandsQueryOptions(),
	});

	return brands?.length || 0;
}

/**
 * Hook to get collections count
 */
export function useCollectionsCount() {
	const { data: collections } = useQuery({
		...collectionsQueryOptions(),
	});

	return collections?.length || 0;
}

/**
 * Hook to get orders count
 */
export function useOrdersCount() {
	const { data: ordersData } = useQuery({
		queryKey: ["bfloorDashboardOrders"],
		queryFn: () => getAllOrders(),
		staleTime: 1000 * 60 * 5,
	});

	// Calculate total orders from grouped orders
	let totalOrders = 0;
	if (ordersData?.groupedOrders) {
		for (const group of ordersData.groupedOrders) {
			totalOrders += group.orders.length;
		}
	}

	return totalOrders;
}

/**
 * Hook to get attributes count
 */
export function useAttributesCount() {
	const { data: attributes } = useQuery({
		queryKey: ["productAttributes"],
		queryFn: () => getAllProductAttributes(),
		staleTime: 1000 * 60 * 5,
	});

	return attributes?.length || 0;
}

/**
 * Hook to get store locations count
 */
export function useStoreLocationsCount() {
	const { data: storeLocations } = useQuery({
		...storeLocationsQueryOptions(),
	});

	return storeLocations?.length || 0;
}
