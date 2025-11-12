import { useRouterState } from "@tanstack/react-router";
import {
	useAttributesCount,
	useBrandsCount,
	useCategoriesCount,
	useCollectionsCount,
	useOrdersCount,
	useProductsCount,
	useStoreLocationsCount,
} from "./useEntityCounts";

/**
 * Hook that returns the appropriate search placeholder with count for the current route
 */
export function useSearchPlaceholderWithCount() {
	const pathname = useRouterState().location.pathname;

	// Always call all hooks (they handle their own conditional logic)
	const productsCount = useProductsCount();
	const categoriesCount = useCategoriesCount();
	const brandsCount = useBrandsCount();
	const collectionsCount = useCollectionsCount();
	const ordersCount = useOrdersCount();
	const attributesCount = useAttributesCount();
	const storeLocationsCount = useStoreLocationsCount();

	// Generate placeholder based on current route
	// For dashboard routes, show specific entity counts based on the base route
	if (pathname.startsWith("/dashboard")) {
		// Check for specific dashboard routes that have their own entity types
		if (pathname.startsWith("/dashboard/categories")) {
			return `искать среди ${categoriesCount} категорий`;
		}
		if (pathname.startsWith("/dashboard/brands")) {
			return `искать среди ${brandsCount} брендов`;
		}
		if (pathname.startsWith("/dashboard/collections")) {
			return `искать среди ${collectionsCount} коллекций`;
		}
		if (pathname.startsWith("/dashboard/attributes")) {
			return `искать среди ${attributesCount} атрибутов`;
		}
		if (pathname.startsWith("/dashboard/orders")) {
			return `искать среди ${ordersCount} заказов`;
		}
		if (pathname.startsWith("/dashboard/misc")) {
			return `искать среди ${storeLocationsCount} адресов`;
		}
		// For all other dashboard routes (including /dashboard, /dashboard/products.*, etc.)
		// default to products count
		return `искать среди ${productsCount} товаров`;
	}

	// For all other routes (including store and index), show product count
	// This allows users to see product count when searching from any page
	return `искать среди ${productsCount} товаров`;
}
