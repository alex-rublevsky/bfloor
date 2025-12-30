import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { inArray, sql } from "drizzle-orm";
import { DB } from "~/db";
import { products, productVariations, variationAttributes } from "~/schema";
import type { ProductVariation } from "~/types";

// Type for variation attributes from database result
type VariationAttributeResult = {
	id: number;
	productVariationId: number | null;
	attributeId: string;
	value: string;
	createdAt: Date;
};

/**
 * Get recommended (featured) products
 *
 * This is a dedicated server function for recommended products that:
 * - Only fetches featured products (isFeatured = true)
 * - Optimized for static/cached data (changes rarely - once a year)
 * - Returns all recommended products (supports pagination for infinite scroll)
 * - Uses extreme caching (30 days) via TanStack Query
 *
 * Note: This function is optimized for rarely-changing data. It uses aggressive
 * client-side caching (30 days) instead of build-time static generation, which
 * works better with Cloudflare Workers SSR architecture.
 */
export const getRecommendedProducts = createServerFn({ method: "GET" })
	.inputValidator((data: { page?: number; limit?: number } = {}) => data)
	.handler(async ({ data = {} }) => {
		try {
			const db = DB();
			const { page = 1, limit: pageLimit = 20 } = data;
			const offsetValue = (page - 1) * pageLimit;

			// Build where clause: only active and featured products
			const whereCondition = sql`${products.isActive} = 1 AND ${products.isFeatured} = 1`;

			// Get total count for pagination info
			const totalCountResult = await db
				.select({ count: sql<number>`COUNT(*)` })
				.from(products)
				.where(whereCondition)
				.all();
			const totalCount = totalCountResult[0]?.count ?? 0;

			// Get products ordered by name (consistent ordering for caching)
			const productsResult = await db
				.select()
				.from(products)
				.where(whereCondition)
				.orderBy(products.name)
				.limit(pageLimit)
				.offset(offsetValue)
				.all();

			if (productsResult.length === 0) {
				return {
					products: [],
					pagination: {
						page,
						limit: pageLimit,
						totalCount: 0,
						totalPages: 0,
						hasNextPage: false,
						hasPreviousPage: false,
					},
				};
			}

			// Only fetch variations for the products we're returning (optimized!)
			const productIds = productsResult.map((p) => p.id);
			const variationsResult = await db
				.select()
				.from(productVariations)
				.where(inArray(productVariations.productId, productIds))
				.all();

			// Only fetch attributes for the variations we found (optimized!)
			const variationIds = variationsResult.map((v) => v.id);
			const attributesResult =
				variationIds.length > 0
					? await db
							.select()
							.from(variationAttributes)
							.where(
								inArray(variationAttributes.productVariationId, variationIds),
							)
							.all()
					: [];

			// Group variations by product ID
			const variationsByProduct = new Map<number, ProductVariation[]>();
			for (const variation of variationsResult) {
				if (variation.productId) {
					const existing = variationsByProduct.get(variation.productId) ?? [];
					existing.push(variation);
					variationsByProduct.set(variation.productId, existing);
				}
			}

			// Group attributes by variation ID
			const attributesByVariation = new Map<
				number,
				VariationAttributeResult[]
			>();
			for (const attr of attributesResult) {
				if (attr.productVariationId) {
					const existing =
						attributesByVariation.get(attr.productVariationId) ?? [];
					existing.push(attr);
					attributesByVariation.set(attr.productVariationId, existing);
				}
			}

			// Build products array with variations and attributes
			const productsArray = productsResult.map((product) => {
				const variations = (variationsByProduct.get(product.id) ?? [])
					.map((variation) => ({
						...variation,
						attributes: attributesByVariation.get(variation.id) ?? [],
					}))
					.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));

				return {
					...product,
					variations,
				};
			});

			return {
				products: productsArray,
				pagination: {
					page,
					limit: pageLimit,
					totalCount,
					totalPages: Math.ceil(totalCount / pageLimit),
					hasNextPage: offsetValue + pageLimit < totalCount,
					hasPreviousPage: page > 1,
				},
			};
		} catch (error) {
			console.error("Error fetching recommended products:", error);
			setResponseStatus(500);
			throw new Error("Failed to fetch recommended products");
		}
	});
