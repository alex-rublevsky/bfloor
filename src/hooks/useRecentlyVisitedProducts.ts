import { useCallback, useMemo } from "react";

const RECENTLY_VISITED_KEY = "bfloor_recently_visited_products";
const MAX_RECENT_PRODUCTS = 20; // Keep last 20 visited products

interface RecentlyVisitedProduct {
	productId: number;
	productSlug: string;
	visitedAt: number; // Timestamp
}

/**
 * Hook to manage recently visited products in localStorage
 *
 * Storage Strategy:
 * - Uses localStorage (persists across sessions)
 * - Stores up to MAX_RECENT_PRODUCTS (20) most recent visits
 * - Automatically removes duplicates (keeps most recent)
 * - Data structure: Array of { productId, productSlug, visitedAt }
 */
export function useRecentlyVisitedProducts() {
	// Get recently visited products from localStorage
	const getRecentlyVisited = useCallback((): RecentlyVisitedProduct[] => {
		if (typeof window === "undefined") return [];

		try {
			const stored = localStorage.getItem(RECENTLY_VISITED_KEY);
			if (!stored) return [];

			const parsed = JSON.parse(stored) as RecentlyVisitedProduct[];
			// Sort by most recent first and limit to MAX_RECENT_PRODUCTS
			return parsed
				.sort((a, b) => b.visitedAt - a.visitedAt)
				.slice(0, MAX_RECENT_PRODUCTS);
		} catch {
			return [];
		}
	}, []);

	// Add a product to recently visited
	const addRecentlyVisited = useCallback(
		(productId: number, productSlug: string) => {
			if (typeof window === "undefined") return;

			try {
				const current = getRecentlyVisited();
				// Remove if already exists (to avoid duplicates)
				const filtered = current.filter((item) => item.productId !== productId);
				// Add new entry at the beginning
				const updated: RecentlyVisitedProduct[] = [
					{
						productId,
						productSlug,
						visitedAt: Date.now(),
					},
					...filtered,
				].slice(0, MAX_RECENT_PRODUCTS);

				localStorage.setItem(RECENTLY_VISITED_KEY, JSON.stringify(updated));
			} catch (error) {
				console.error("Failed to save recently visited product:", error);
			}
		},
		[getRecentlyVisited],
	);

	// Get product IDs for querying
	const getRecentlyVisitedProductIds = useCallback((): number[] => {
		return getRecentlyVisited().map((item) => item.productId);
	}, [getRecentlyVisited]);

	// Get recently visited products (memoized)
	const recentlyVisited = useMemo(
		() => getRecentlyVisited(),
		[getRecentlyVisited],
	);

	return {
		recentlyVisited,
		addRecentlyVisited,
		getRecentlyVisitedProductIds,
		hasRecentlyVisited: recentlyVisited.length > 0,
	};
}

/**
 * Alternative: Direct localStorage utility functions (no hook)
 * Use this if you want to track visits outside of React components
 */
export const recentlyVisitedProducts = {
	/**
	 * Add a product to recently visited (can be called from anywhere)
	 */
	add: (productId: number, productSlug: string): void => {
		if (typeof window === "undefined") return;

		try {
			const stored = localStorage.getItem(RECENTLY_VISITED_KEY);
			const current: RecentlyVisitedProduct[] = stored
				? JSON.parse(stored)
				: [];

			// Remove if already exists
			const filtered = current.filter((item) => item.productId !== productId);

			// Add new entry at the beginning
			const updated: RecentlyVisitedProduct[] = [
				{
					productId,
					productSlug,
					visitedAt: Date.now(),
				},
				...filtered,
			].slice(0, MAX_RECENT_PRODUCTS);

			localStorage.setItem(RECENTLY_VISITED_KEY, JSON.stringify(updated));
		} catch (error) {
			console.error("Failed to save recently visited product:", error);
		}
	},

	/**
	 * Get all recently visited products
	 */
	getAll: (): RecentlyVisitedProduct[] => {
		if (typeof window === "undefined") return [];

		try {
			const stored = localStorage.getItem(RECENTLY_VISITED_KEY);
			if (!stored) return [];

			const parsed = JSON.parse(stored) as RecentlyVisitedProduct[];
			return parsed
				.sort((a, b) => b.visitedAt - a.visitedAt)
				.slice(0, MAX_RECENT_PRODUCTS);
		} catch {
			return [];
		}
	},

	/**
	 * Get product IDs only
	 */
	getProductIds: (): number[] => {
		return recentlyVisitedProducts.getAll().map((item) => item.productId);
	},

	/**
	 * Clear all recently visited products
	 */
	clear: (): void => {
		if (typeof window === "undefined") return;
		localStorage.removeItem(RECENTLY_VISITED_KEY);
	},
};
