import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { eq, inArray, type SQL, sql } from "drizzle-orm";
import { DB } from "~/db";
import {
	products,
	productStoreLocations,
	productVariations,
	variationAttributes,
} from "~/schema";
import { buildFts5Query } from "~/utils/search/queryExpander";

export const getAllProducts = createServerFn({ method: "GET" })
	.inputValidator(
		(
			data: {
				page?: number;
				limit?: number;
				search?: string;
				categorySlug?: string;
				brandSlug?: string;
				collectionSlug?: string;
				storeLocationId?: number;
				attributeFilters?: Record<number, string[]>; // attributeId -> array of value IDs
				minPrice?: number;
				maxPrice?: number;
				tag?: string;
				hasDiscount?: boolean;
				isFeatured?: boolean;
				productIds?: number[]; // Filter by specific product IDs
				sort?:
					| "relevant"
					| "name"
					| "price-asc"
					| "price-desc"
					| "newest"
					| "oldest";
			} = {},
		) => data,
	)
	.handler(async ({ data = {} }) => {
		try {
			const db = DB();
			const { page, limit: pageLimit } = data;
			const rawSearch =
				typeof data.search === "string" ? data.search : undefined;
			const normalizedSearch = rawSearch?.trim().replace(/\s+/g, " ");
			const effectiveSearch =
				normalizedSearch && normalizedSearch.length >= 3
					? normalizedSearch
					: undefined;

			const categoryFilter =
				data.categorySlug && data.categorySlug.length > 0
					? data.categorySlug
					: undefined;
			const brandFilter =
				data.brandSlug && data.brandSlug.length > 0
					? data.brandSlug
					: undefined;
			const collectionFilter =
				data.collectionSlug && data.collectionSlug.length > 0
					? data.collectionSlug
					: undefined;
			const storeLocationFilter =
				typeof data.storeLocationId === "number"
					? data.storeLocationId
					: undefined;
			const attributeFilters = data.attributeFilters || {};
			const minPriceFilter =
				typeof data.minPrice === "number" ? data.minPrice : undefined;
			const maxPriceFilter =
				typeof data.maxPrice === "number" ? data.maxPrice : undefined;
			const tagFilter = data.tag && data.tag.length > 0 ? data.tag : undefined;
			const hasDiscountFilter = data.hasDiscount === true;
			const isFeaturedFilter = data.isFeatured === true;
			const productIdsFilter =
				Array.isArray(data.productIds) && data.productIds.length > 0
					? data.productIds
					: undefined;
			const sort = data.sort;

			// Calculate pagination if provided
			const hasPagination =
				typeof page === "number" && typeof pageLimit === "number";
			const offsetValue = hasPagination ? (page - 1) * pageLimit : 0;

			// Build where clause (search + filters)
			const conditions: SQL[] = [];

			// Store FTS result IDs for filtering and ordering (execute FTS5 query once)
			let ftsProductIds: number[] | undefined;

			if (effectiveSearch) {
				// Use FTS5 for all searches (trigram tokenizer requires 3+ chars)
				const ftsQuery = buildFts5Query(effectiveSearch, {
					enablePrefixMatch: true,
					operator: "AND",
				});

				if (ftsQuery) {
					// Execute FTS5 query ONCE to get both IDs and ranking
					try {
						const ftsResults = await db.all<{ rowid: number; rank: number }>(
							sql`SELECT rowid, rank FROM products_fts WHERE products_fts MATCH ${ftsQuery} ORDER BY rank`,
						);

						ftsProductIds = ftsResults.map((r) => r.rowid);

						if (ftsProductIds.length > 0) {
							// Use pure Drizzle inArray for WHERE clause (no subquery!)
							conditions.push(inArray(products.id, ftsProductIds));
						} else {
							// No FTS results, exclude all products
							conditions.push(sql`1 = 0`);
						}
					} catch (error) {
						console.error("FTS5 search error:", error);
						// If FTS5 fails completely, exclude all products (shouldn't happen in production)
						conditions.push(sql`1 = 0`);
					}
				} else {
					// Search term too short (< 3 chars), exclude all products
					// Minimum 3 characters required for FTS5 trigram tokenizer
					conditions.push(sql`1 = 0`);
				}
			}
			if (categoryFilter) {
				conditions.push(eq(products.categorySlug, categoryFilter));
			}
			if (brandFilter) {
				conditions.push(eq(products.brandSlug, brandFilter));
			}
			if (collectionFilter) {
				conditions.push(eq(products.collectionSlug, collectionFilter));
			}
			if (minPriceFilter !== undefined) {
				conditions.push(sql`${products.price} >= ${minPriceFilter}`);
			}
			if (maxPriceFilter !== undefined) {
				conditions.push(sql`${products.price} <= ${maxPriceFilter}`);
			}
			if (tagFilter) {
				// Filter products where tags JSON array contains the tag
				// Using LIKE for simplicity (matches JSON array format: ["tag1","tag2"])
				conditions.push(sql`${products.tags} LIKE ${`%"${tagFilter}"%`}`);
			}
			if (hasDiscountFilter) {
				// Filter products where discount is not null and greater than 0
				conditions.push(
					sql`${products.discount} IS NOT NULL AND ${products.discount} > 0`,
				);
			}
			if (isFeaturedFilter) {
				// Filter products where isFeatured is true
				conditions.push(eq(products.isFeatured, true));
			}
			if (productIdsFilter) {
				// Filter products by specific IDs
				conditions.push(inArray(products.id, productIdsFilter));
			}
			// Handle store location filter using EXISTS subquery (single query, more efficient)
			if (storeLocationFilter !== undefined) {
				conditions.push(sql`EXISTS (
					SELECT 1 FROM ${productStoreLocations}
					WHERE ${productStoreLocations.productId} = ${products.id}
					  AND ${productStoreLocations.storeLocationId} = ${storeLocationFilter}
				)`);
			}

			// Handle attribute filters using junction table (SQL-based, much faster!)
			if (Object.keys(attributeFilters).length > 0) {
				for (const [attrIdStr, valueIdStrs] of Object.entries(
					attributeFilters,
				)) {
					const attrId = parseInt(attrIdStr, 10);
					const valueIds = valueIdStrs.map((id) => parseInt(id, 10));

					// For each attribute filter, add EXISTS subquery
					conditions.push(sql`EXISTS (
					SELECT 1 FROM product_attribute_values pav
					WHERE pav.product_id = ${products.id}
					  AND pav.attribute_id = ${attrId}
					  AND pav.value_id IN (${sql.join(valueIds, sql`, `)})
				)`);
				}
			}

			const finalWhereCondition =
				conditions.length > 0 ? sql.join(conditions, sql` AND `) : sql`1=1`;

			// Get total count for pagination info (respecting search)
			const totalCountResult = await db
				.select({ count: sql<number>`COUNT(*)` })
				.from(products)
				.where(finalWhereCondition)
				.all();
			const totalCount = totalCountResult[0]?.count ?? 0;

			// Determine ordering
			let orderSql: SQL | typeof products.name = products.name;
			if (sort === "price-asc") {
				orderSql = sql`${products.price} asc`;
			} else if (sort === "price-desc") {
				orderSql = sql`${products.price} desc`;
			} else if (sort === "newest") {
				orderSql = sql`${products.createdAt} desc`;
			} else if (sort === "oldest") {
				orderSql = sql`${products.createdAt} asc`;
			} else if (effectiveSearch && ftsProductIds && ftsProductIds.length > 0) {
				// Use pre-fetched FTS5 ranking (no duplicate query!)
				// Build CASE statement to maintain FTS rank order from the single query we already executed
				const caseStatements = ftsProductIds
					.map((id, index) => `WHEN ${products.id.name} = ${id} THEN ${index}`)
					.join(" ");
				orderSql = sql.raw(`CASE ${caseStatements} ELSE 9999 END`);
			}

			// OPTIMIZED: Single query with LEFT JOINs to fetch products, variations, and attributes
			// This replaces 3 separate queries (products → variations → attributes)
			const productsWithRelations =
				offsetValue !== undefined && pageLimit
					? await db
							.select({
								product: products,
								variation: productVariations,
								attribute: variationAttributes,
							})
							.from(products)
							.leftJoin(
								productVariations,
								eq(productVariations.productId, products.id),
							)
							.leftJoin(
								variationAttributes,
								eq(
									variationAttributes.productVariationId,
									productVariations.id,
								),
							)
							.where(finalWhereCondition)
							.orderBy(orderSql)
							.limit(pageLimit)
							.offset(offsetValue)
							.all()
					: await db
							.select({
								product: products,
								variation: productVariations,
								attribute: variationAttributes,
							})
							.from(products)
							.leftJoin(
								productVariations,
								eq(productVariations.productId, products.id),
							)
							.leftJoin(
								variationAttributes,
								eq(
									variationAttributes.productVariationId,
									productVariations.id,
								),
							)
							.where(finalWhereCondition)
							.orderBy(orderSql)
							.all();

			// Group results by product (in-memory grouping is fast)
			const productsMap = new Map<
				number,
				{
					product: typeof products.$inferSelect;
					variations: Map<
						number,
						{
							variation: typeof productVariations.$inferSelect;
							attributes: Array<typeof variationAttributes.$inferSelect>;
						}
					>;
				}
			>();

			for (const row of productsWithRelations) {
				// Get or create product entry
				if (!productsMap.has(row.product.id)) {
					productsMap.set(row.product.id, {
						product: row.product,
						variations: new Map(),
					});
				}

				const productEntry = productsMap.get(row.product.id);
				if (!productEntry) continue;

				// Add variation if exists
				if (row.variation) {
					if (!productEntry.variations.has(row.variation.id)) {
						productEntry.variations.set(row.variation.id, {
							variation: row.variation,
							attributes: [],
						});
					}

					// Add attribute if exists
					if (row.attribute) {
						const variationEntry = productEntry.variations.get(
							row.variation.id,
						);
						if (variationEntry) {
							variationEntry.attributes.push(row.attribute);
						}
					}
				}
			}

			// Convert map to array format
			const productsResult = Array.from(productsMap.values()).map((entry) => ({
				...entry.product,
			}));

			const variationsByProduct = new Map<
				number,
				Array<{
					variation: typeof productVariations.$inferSelect;
					attributes: Array<typeof variationAttributes.$inferSelect>;
				}>
			>();

			for (const [productId, entry] of productsMap.entries()) {
				const variations = Array.from(entry.variations.values());
				if (variations.length > 0) {
					variationsByProduct.set(productId, variations);
				}
			}

			const productsArray = productsResult.map((product) => {
				const variationEntries = variationsByProduct.get(product.id) || [];

				const variationsWithAttributes = variationEntries
					.map((entry) => ({
						...entry.variation,
						attributes: entry.attributes,
					}))
					.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));

				// Process images - convert JSON array to comma-separated string
				let imagesString = "";
				if (product.images) {
					try {
						const imagesArray = JSON.parse(product.images) as string[];
						imagesString = imagesArray.join(", ");
					} catch {
						// If it's already a comma-separated string, use it as-is
						imagesString = product.images;
					}
				}

				// Process productAttributes - convert JSON string to array format
				// This transformation is needed for the client
				let productAttributesArray: { attributeId: string; value: string }[] =
					[];
				if (product.productAttributes) {
					try {
						const parsed = JSON.parse(product.productAttributes);
						// Convert object to array format expected by frontend
						if (
							typeof parsed === "object" &&
							parsed !== null &&
							!Array.isArray(parsed)
						) {
							// Convert object to array of {attributeId, value} pairs
							productAttributesArray = Object.entries(parsed).map(
								([key, value]) => ({
									attributeId: key,
									value: String(value),
								}),
							);
						} else if (Array.isArray(parsed)) {
							productAttributesArray = parsed;
						}
					} catch {
						// If parsing fails, use empty array
						productAttributesArray = [];
					}
				}

				// Process tags - convert JSON string to array format
				let tagsArray: string[] = [];
				if (product.tags) {
					try {
						const parsed = JSON.parse(product.tags);
						if (Array.isArray(parsed)) {
							tagsArray = parsed;
						}
					} catch {
						// If parsing fails, use empty array
						tagsArray = [];
					}
				}

				return {
					...product,
					images: imagesString,
					productAttributes: JSON.stringify(productAttributesArray),
					tags: JSON.stringify(tagsArray),
					variations: variationsWithAttributes,
				};
			});

			const result = {
				products: productsArray,
			};

			// Add pagination info if pagination was used
			if (hasPagination && page !== undefined && pageLimit !== undefined) {
				const hasNextPage = offsetValue + pageLimit < totalCount;
				const hasPreviousPage = page > 1;

				return {
					...result,
					pagination: {
						page,
						limit: pageLimit,
						totalCount,
						totalPages: Math.ceil(totalCount / pageLimit),
						hasNextPage,
						hasPreviousPage,
					},
				};
			}

			return {
				...result,
				pagination: {
					page: 1,
					limit: totalCount,
					totalCount,
					totalPages: 1,
					hasNextPage: false,
					hasPreviousPage: false,
				},
			};
		} catch (error) {
			console.error("Error fetching dashboard data:", error);
			console.error(
				"Error stack:",
				error instanceof Error ? error.stack : "No stack trace",
			);
			console.error("Error details:", {
				message: error instanceof Error ? error.message : String(error),
				name: error instanceof Error ? error.name : "Unknown",
			});
			setResponseStatus(500);
			throw new Error(
				`Failed to fetch dashboard data: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	});
