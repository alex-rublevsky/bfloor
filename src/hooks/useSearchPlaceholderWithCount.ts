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
	switch (pathname) {
		case "/dashboard":
			return `искать среди ${productsCount} товаров`;
		case "/dashboard/categories":
			return `искать среди ${categoriesCount} категорий`;
		case "/dashboard/brands":
			return `искать среди ${brandsCount} брендов`;
		case "/dashboard/collections":
			return `искать среди ${collectionsCount} коллекций`;
		case "/dashboard/attributes":
			return `искать среди ${attributesCount} атрибутов`;
		case "/dashboard/orders":
			return `искать среди ${ordersCount} заказов`;
		case "/dashboard/misc":
			return `искать среди ${storeLocationsCount} адресов`;
		default:
			return "искать...";
	}
}
