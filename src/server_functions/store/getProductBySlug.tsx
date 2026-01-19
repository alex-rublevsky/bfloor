/**
 * Get Product By Slug (With Variations)
 *
 * CACHING STRATEGY:
 * This function fetches the COMPLETE product data including variations.
 * It's used when:
 * - Product is NOT in cache (direct navigation to product page)
 * - Full product data is needed (including variations)
 *
 * For optimized caching when product is already cached from list views,
 * see: getProductDetailsBySlug (fetches without variations, merges with cache)
 *
 * See: src/lib/queryOptions.ts - productQueryOptions() for the caching logic
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
	products,
	productStoreLocations,
	productVariations,
} from "~/schema";
import type { VariationAttribute } from "~/types";
import {
	parseImages,
	parseProductAttributes,
	parseVariationAttributes,
} from "~/utils/productParsing";
import { incrementProductView } from "./incrementProductView";

export const getProductBySlug = createServerFn({ method: "GET" })
	.inputValidator((productId: string) => productId)
	.handler(async ({ data: productId }) => {
		const db = DB();

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

		let variationsArray: Array<{
			id: number;
			productId: number | null;
			sku: string;
			price: number;
			sort: number;
			discount: number | null;
			createdAt: Date;
			attributes: VariationAttribute[];
		}> = [];

		if (baseProduct.hasVariations) {
			const variations = await db
				.select()
				.from(productVariations)
				.where(eq(productVariations.productId, baseProduct.id))
				.all();

			variationsArray = variations.map((variation) => ({
				id: variation.id,
				productId: variation.productId,
				sku: variation.sku,
				price: variation.price,
				sort: variation.sort || 0,
				discount: variation.discount,
				createdAt: variation.createdAt,
				attributes: parseVariationAttributes(variation.variationAttributes),
			}));
		}

		const imagesArray = parseImages(baseProduct.images);
		const productAttributesArray = parseProductAttributes(
			baseProduct.productAttributes,
		);

		const productWithDetails = {
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
			variations: variationsArray,
		};

		// Track product view (fire-and-forget, non-blocking)
		// Only increment for active products
		if (baseProduct.isActive && baseProduct.id) {
			incrementProductView({ data: baseProduct.id }).catch((error) => {
				// Silently fail - view tracking shouldn't break product page
				console.error("Failed to increment product view:", error);
			});
		}

		return productWithDetails;
	});
