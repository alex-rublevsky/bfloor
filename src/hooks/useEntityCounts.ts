import { useSuspenseQuery } from "@tanstack/react-query";
import { getAllProductCategories } from "~/server_functions/dashboard/categories/getAllProductCategories";
import { getAllCollections } from "~/server_functions/dashboard/collections/getAllCollections";
import { getAllBrands } from "~/server_functions/dashboard/getAllBrands";
import { getAllOrders } from "~/server_functions/dashboard/orders/getAllOrders";
import { getAllProducts } from "~/server_functions/dashboard/store/getAllProducts";
import { getAllStoreLocations } from "~/server_functions/dashboard/storeLocations/getAllStoreLocations";

/**
 * Hook to get products count
 */
export function useProductsCount() {
	const { data: productsData } = useSuspenseQuery({
		queryKey: ["bfloorDashboardProducts"],
		queryFn: () => getAllProducts(),
		staleTime: 1000 * 60 * 5,
	});

	// Calculate total products from grouped products
	let totalProducts = 0;
	if (productsData?.groupedProducts) {
		for (const category of productsData.groupedProducts) {
			totalProducts += category.products.length;
		}
	}

	return totalProducts;
}

/**
 * Hook to get categories count
 */
export function useCategoriesCount() {
	const { data: categories } = useSuspenseQuery({
		queryKey: ["bfloorDashboardCategories"],
		queryFn: () => getAllProductCategories(),
		staleTime: 1000 * 60 * 5,
	});

	return categories?.length || 0;
}

/**
 * Hook to get brands count
 */
export function useBrandsCount() {
	const { data: brands } = useSuspenseQuery({
		queryKey: ["bfloorDashboardBrands"],
		queryFn: () => getAllBrands(),
		staleTime: 1000 * 60 * 5,
	});

	return brands?.length || 0;
}

/**
 * Hook to get collections count
 */
export function useCollectionsCount() {
	const { data: collections } = useSuspenseQuery({
		queryKey: ["bfloorDashboardCollections"],
		queryFn: () => getAllCollections(),
		staleTime: 1000 * 60 * 5,
	});

	return collections?.length || 0;
}

/**
 * Hook to get orders count
 */
export function useOrdersCount() {
	const { data: ordersData } = useSuspenseQuery({
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
 * Hook to get store locations count
 */
export function useStoreLocationsCount() {
	const { data: storeLocations } = useSuspenseQuery({
		queryKey: ["bfloorDashboardStoreLocations"],
		queryFn: () => getAllStoreLocations(),
		staleTime: 1000 * 60 * 5,
	});

	return storeLocations?.length || 0;
}
