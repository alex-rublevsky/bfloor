/**
 * Get Product Details By Slug (Without Variations)
 *
 * CACHING STRATEGY:
 * This function is designed to work with TanStack Query's caching system to optimize
 * performance when navigating from list views to detail pages.
 *
 * How it works:
 * 1. List views (getAllProducts/getStoreData) cache products WITH variations
 * 2. When navigating to a detail page:
 *    - If product is already cached: Use this function to fetch only details (no variations)
 *      and merge with cached data (preserving cached variations)
 *    - If product is NOT cached: Use getProductBySlug to fetch everything including variations
 *
 * Why separate functions?
 * - Different cache keys allow both "full product" and "product details" to exist in cache
 * - Performance: When product is cached, we only fetch what's missing (details), not variations
 * - Variations are often already in cache from list views, so re-fetching is wasteful
 *
 * See: src/lib/queryOptions.ts - productQueryOptions() for the merge logic
 */

import { createServerFn } from "@tanstack/react-start";
import { eq, sql } from "drizzle-orm";
import { getCountryById } from "~/data/countries";
import { getStoreLocationsByIds } from "~/data/storeLocations";
import { DB } from "~/db";
import {
	brands,
	categories,
	collections,
	productStoreLocations,
	products,
} from "~/schema";
import { parseImages, parseProductAttributes } from "~/utils/productParsing";
import { incrementProductView } from "./incrementProductView";

export const getProductDetailsBySlug = createServerFn({ method: "GET" })
	.inputValidator((productId: string) => productId)
	.handler(async ({ data: productId }) => {
		const db = DB();

		// Single query with GROUP_CONCAT for store locations (optimized - same as getProductBySlug)
		const result = await db
			.select({
				products: products,
				categories: categories,
				brands: brands,
				collections: collections,
				storeLocationIds: sql<string | null>`(
					SELECT GROUP_CONCAT(${productStoreLocations.storeLocationId})
					FROM ${productStoreLocations}
					WHERE ${productStoreLocations.productId} = ${products.id}
				)`,
			})
			.from(products)
			.where(eq(products.slug, productId))
			.leftJoin(categories, eq(products.categorySlug, categories.slug))
			.leftJoin(brands, eq(products.brandSlug, brands.slug))
			.leftJoin(collections, eq(products.collectionSlug, collections.slug))
			.all();

		if (!result || result.length === 0) {
			// Don't set response status - let TanStack Router handle 404s via notFound()
			// Setting status here causes Vercel to return platform-level NOT_FOUND error
			throw new Error("Product not found");
		}

		const firstRow = result[0];
		const baseProduct = firstRow.products;

		// Parse store location IDs from comma-separated string (all products have store locations)
		const locationIds: number[] = firstRow.storeLocationIds
			? firstRow.storeLocationIds
					.split(",")
					.map((id) => parseInt(id, 10))
					.filter((id): id is number => !Number.isNaN(id))
			: [];
		const storeLocationsData = getStoreLocationsByIds(locationIds);

		// Get country from hardcoded data if brand has countryId
		const countryData = firstRow.brands?.countryId
			? getCountryById(firstRow.brands.countryId)
			: null;

		// Use utility functions for parsing (consistent with getProductBySlug)
		const imagesArray = parseImages(baseProduct.images);
		const productAttributesArray = parseProductAttributes(
			baseProduct.productAttributes,
		);

		// Track product view (fire-and-forget, non-blocking)
		// Only increment for active products
		if (baseProduct.isActive && baseProduct.id) {
			incrementProductView({ data: baseProduct.id }).catch((error) => {
				// Silently fail - view tracking shouldn't break product page
				console.error("Failed to increment product view:", error);
			});
		}

		// Return product WITHOUT variations - variations should come from cache
		// The merge logic in productQueryOptions will preserve cached variations
		return {
			...baseProduct,
			images: imagesArray, // Return as array - TanStack will serialize/deserialize automatically
			productAttributes: productAttributesArray,
			category: firstRow.categories
				? {
						name: firstRow.categories.name,
						slug: firstRow.categories.slug,
					}
				: null,
			brand: firstRow.brands
				? {
						name: firstRow.brands.name,
						slug: firstRow.brands.slug,
						image: firstRow.brands.image,
						country: countryData
							? {
									name: countryData.name,
									flagImage: countryData.flagImage,
								}
							: null,
					}
				: null,
			collection: firstRow.collections
				? {
						name: firstRow.collections.name,
						slug: firstRow.collections.slug,
					}
				: null,
			storeLocations: storeLocationsData.map((loc) => ({
				id: loc.id,
				address: loc.address,
				description: loc.description,
				openingHours: loc.openingHours,
			})),
			variations: [], // Intentionally empty - variations come from cache
		};
	});
