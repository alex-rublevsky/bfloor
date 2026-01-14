import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { eq, sql } from "drizzle-orm";
import { DB } from "~/db";
import { products, productVariations } from "~/schema";

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

		// OPTIMIZATION: Single query with LEFT JOIN for variations
		// Variation attributes are in JSON field (dual storage pattern)
		const productsWithRelations = await db
			.select({
				product: products,
				variation: productVariations,
			})
			.from(products)
			.leftJoin(
				productVariations,
				eq(productVariations.productId, products.id),
			)
			.where(whereCondition)
			.orderBy(products.name)
			.all();

		// Group results by product
		const productMap = new Map<
			number,
			{
				product: typeof products.$inferSelect;
				variations: Map<number, typeof productVariations.$inferSelect>;
			}
		>();

		for (const row of productsWithRelations) {
			if (!row.product.id) continue;

			// Initialize product entry if needed
			if (!productMap.has(row.product.id)) {
				productMap.set(row.product.id, {
					product: row.product,
					variations: new Map(),
				});
			}

			const productEntry = productMap.get(row.product.id);
			if (!productEntry) continue;

			// Add variation if exists (attributes are in JSON field)
			if (row.variation?.id) {
				if (!productEntry.variations.has(row.variation.id)) {
					productEntry.variations.set(row.variation.id, row.variation);
				}
			}
		}

		// Build products array with variations and parsed attributes
		const productsArray = Array.from(productMap.values()).map(
			({ product, variations }) => {
				const variationsArray = Array.from(variations.values())
					.map((variation) => {
						// Parse variation attributes from JSON field (dual storage pattern)
						let attributes = [];
						if (variation.variationAttributes) {
							try {
								attributes = JSON.parse(variation.variationAttributes);
							} catch (error) {
								console.error("Failed to parse variation attributes:", error);
								attributes = [];
							}
						}
						return {
							...variation,
							attributes,
						};
					})
					.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));

				return {
					...product,
					variations: variationsArray,
				};
			},
		);

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
