/**
 * useEnrichedCart Hook
 *
 * Enriches minimal cart items with product data from TanStack Query cache
 * This eliminates data duplication while providing all necessary display data
 */

import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import type { CartItem } from "~/lib/cartContext";
import { storeDataQueryOptions } from "~/lib/queryOptions";
import type { ProductWithVariations } from "~/types";

/**
 * Enriched cart item with all display data
 */
export interface EnrichedCartItem extends CartItem {
	// Enriched from products cache
	productName: string;
	productSlug: string;
	price: number;
	image?: string;
	attributes?: Record<string, string>;
	maxStock: number;
	unlimitedStock: boolean;
	discount?: number | null;
	weightInfo?: {
		totalWeight: number;
	};
}

export function useEnrichedCart(cartItems: CartItem[]): EnrichedCartItem[] {
	const queryClient = useQueryClient();

	return useMemo(() => {
		// Get products from TanStack Query cache
		const storeData = queryClient.getQueryData(
			storeDataQueryOptions().queryKey,
		);
		const products: ProductWithVariations[] = storeData?.products || [];

		return cartItems
			.map((cartItem) => {
				const product = products.find((p) => p.id === cartItem.productId);
				if (!product) {
					// Product no longer exists - return null to filter out
					return null;
				}

				const variation = cartItem.variationId
					? product.variations?.find((v) => v.id === cartItem.variationId)
					: null;

				// Calculate price
				const price = (() => {
					if (product.hasVariations && variation) {
						return variation.price;
					}
					if (product.price === 0 && variation) {
						return variation.price;
					}
					return variation ? variation.price : product.price;
				})();

				// Get image
				const image =
					product.images && typeof product.images === "string"
						? product.images.split(",")[0]?.trim() || undefined
						: undefined;

				// Get attributes (for display)
				const attributes: Record<string, string> = {};
				if (variation?.attributes) {
					for (const attr of variation.attributes) {
						attributes[attr.attributeId] = attr.value;
					}
				}

				// Calculate maxStock
				const maxStock = (() => {
					if (product.unlimitedStock) {
						return Number.MAX_SAFE_INTEGER;
					}
					if (variation) {
						return variation.stock || 0;
					}
					return product.stock || 0;
				})();

				// Return enriched cart item
				return {
					// Original cart data
					...cartItem,

					// Enriched from cache
					productName: product.name,
					productSlug: product.slug,
					price,
					image,
					attributes:
						Object.keys(attributes).length > 0 ? attributes : undefined,
					maxStock,
					unlimitedStock:
						product.unlimitedStock || product.categorySlug === "stickers",
					discount: variation?.discount || product.discount,

					// Weight info (if applicable)
					...(product.weight
						? {
								weightInfo: {
									totalWeight: parseInt(product.weight, 10),
								},
							}
						: {}),
				} as EnrichedCartItem;
			})
			.filter((item): item is EnrichedCartItem => item !== null);
	}, [cartItems, queryClient]);
}
