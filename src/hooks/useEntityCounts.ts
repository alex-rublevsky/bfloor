import { useQuery } from "@tanstack/react-query";
import { getAllStoreLocations } from "~/data/storeLocations";
import {
	totalAttributesCountQueryOptions,
	totalBrandsCountQueryOptions,
	totalCategoriesCountQueryOptions,
	totalCollectionsCountQueryOptions,
	totalOrdersCountQueryOptions,
	totalProductsCountQueryOptions,
} from "~/lib/queryOptions";

/**
 * Hook to get products count (efficient SQL COUNT)
 */
export function useProductsCount() {
	const { data } = useQuery(totalProductsCountQueryOptions());
	return data ?? 0;
}

/**
 * Hook to get categories count (efficient SQL COUNT)
 */
export function useCategoriesCount() {
	const { data } = useQuery(totalCategoriesCountQueryOptions());
	return data ?? 0;
}

/**
 * Hook to get brands count (efficient SQL COUNT)
 */
export function useBrandsCount() {
	const { data } = useQuery(totalBrandsCountQueryOptions());
	return data ?? 0;
}

/**
 * Hook to get collections count (efficient SQL COUNT)
 */
export function useCollectionsCount() {
	const { data } = useQuery(totalCollectionsCountQueryOptions());
	return data ?? 0;
}

/**
 * Hook to get orders count (efficient SQL COUNT)
 */
export function useOrdersCount() {
	const { data } = useQuery(totalOrdersCountQueryOptions());
	return data ?? 0;
}

/**
 * Hook to get attributes count (efficient SQL COUNT)
 */
export function useAttributesCount() {
	const { data } = useQuery(totalAttributesCountQueryOptions());
	return data ?? 0;
}

/**
 * Hook to get store locations count (from hardcoded data)
 */
export function useStoreLocationsCount() {
	// Store locations are now hardcoded, so just return the count
	return getAllStoreLocations().length;
}
