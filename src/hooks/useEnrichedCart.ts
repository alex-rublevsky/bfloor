/**
 * useEnrichedCart Hook
 *
 * Enriches minimal cart items with product data from TanStack Query cache
 * This eliminates data duplication while providing all necessary display data
 */

import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import type { CartItem } from "~/lib/cartContext";
import type { ProductWithDetails, ProductWithVariations } from "~/types";
import { getStoreProductsFromInfiniteCache } from "~/utils/storeCache";

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
	discount?: number | null;
}

export function useEnrichedCart(cartItems: CartItem[]): EnrichedCartItem[] {
	const queryClient = useQueryClient();

	return useMemo(() => {
		const products: ProductWithVariations[] =
			getStoreProductsFromInfiniteCache(queryClient);
		const productQueries = queryClient
			.getQueryCache()
			.findAll({ queryKey: ["bfloorProduct"] });

		// Build a Map for O(1) product lookup from query cache
		// This is more efficient than mapping over queries for each cart item
		const productCacheMap = new Map<number, ProductWithVariations>();
		for (const query of productQueries) {
			const product = query.state.data as ProductWithDetails | undefined;
			if (product?.id && "variations" in product) {
				// ProductWithDetails has variations, safe to cast for cart enrichment
				productCacheMap.set(
					product.id,
					product as unknown as ProductWithVariations,
				);
			}
		}

		const findProduct = (productId: number): ProductWithVariations | null => {
			// First check main products array (most common case)
			const product = products.find((p) => p.id === productId);
			if (product) return product;

			// Fallback to query cache (for individually fetched products)
			return productCacheMap.get(productId) || null;
		};

		return cartItems
			.map((cartItem) => {
				const product = findProduct(cartItem.productId);
				if (!product || !product.isActive) {
					// Product no longer exists or is inactive - return null to filter out
					return null;
				}

				const variation = cartItem.variationId
					? product.variations?.find((v) => v.id === cartItem.variationId)
					: null;

				// Calculate price: use variation price if available, otherwise product price
				const price = variation?.price ?? product.price;

				// Get image
				const image =
					product.images && typeof product.images === "string"
						? product.images.split(",")[0]?.trim() || undefined
						: undefined;

				// Get attributes (for display) - build object only if variation has attributes
				const attributes = variation?.attributes?.length
					? Object.fromEntries(
							variation.attributes.map((attr) => [
								attr.attributeId,
								attr.value,
							]),
						)
					: undefined;

				// Return enriched cart item
				return {
					// Original cart data
					...cartItem,

					// Enriched from cache
					productName: product.name,
					productSlug: product.slug,
					price,
					image,
					attributes,
					discount: variation?.discount ?? product.discount,
				} as EnrichedCartItem;
			})
			.filter((item): item is EnrichedCartItem => item !== null);
	}, [cartItems, queryClient]);
}
