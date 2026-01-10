import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { eq, inArray, isNull, or, type SQL, sql } from "drizzle-orm";
import { DB } from "~/db";
import {
	attributeValues,
	productAttributes,
	products,
	productVariations,
	variationAttributes,
} from "~/schema";
import { getAttributeMappings } from "~/utils/attributeMapping";
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
				attributeFilters?: Record<number, string[]>; // attributeId -> array of value IDs
				uncategorizedOnly?: boolean;
				withoutBrandOnly?: boolean;
				withoutCollectionOnly?: boolean;
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
			const attributeFilters = data.attributeFilters || {};
			const uncategorizedOnlyFilter = data.uncategorizedOnly === true;
			const withoutBrandOnlyFilter = data.withoutBrandOnly === true;
			const withoutCollectionOnlyFilter = data.withoutCollectionOnly === true;
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
			if (uncategorizedOnlyFilter) {
				// Filter products where categorySlug is null or empty
				conditions.push(
					or(isNull(products.categorySlug), eq(products.categorySlug, "")) ??
						sql`1=0`,
				);
			}
			if (withoutBrandOnlyFilter) {
				// Filter products where brandSlug is null or empty
				conditions.push(
					or(isNull(products.brandSlug), eq(products.brandSlug, "")) ??
						sql`1=0`,
				);
			}
			if (withoutCollectionOnlyFilter) {
				// Filter products where collectionSlug is null or empty
				conditions.push(
					or(
						isNull(products.collectionSlug),
						eq(products.collectionSlug, ""),
					) ?? sql`1=0`,
				);
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
			const whereCondition =
				conditions.length > 0 ? sql.join(conditions, sql` AND `) : sql`1=1`;

			// Get all products matching basic filters first
			let allMatchingProducts = await db
				.select()
				.from(products)
				.where(whereCondition)
				.all();

		// Filter by attributes if provided
		if (Object.keys(attributeFilters).length > 0) {
			// Get attribute slugs and value mappings (cached)
			const { idToSlug: attributeIdToSlug } = await getAttributeMappings();

				// Get standardized values for the selected attribute values
				const allValueIds = new Set<number>();
				for (const valueIds of Object.values(attributeFilters)) {
					for (const valueId of valueIds) {
						const numId = parseInt(valueId, 10);
						if (!Number.isNaN(numId)) {
							allValueIds.add(numId);
						}
					}
				}

				const stdValues =
					allValueIds.size > 0
						? await db
								.select()
								.from(attributeValues)
								.where(inArray(attributeValues.id, Array.from(allValueIds)))
						: [];

				// Create a map of attributeId -> Set of value strings
				const attributeValueMap = new Map<number, Set<string>>();
				for (const stdValue of stdValues) {
					if (!attributeValueMap.has(stdValue.attributeId)) {
						attributeValueMap.set(stdValue.attributeId, new Set());
					}
					attributeValueMap.get(stdValue.attributeId)?.add(stdValue.value);
				}

				// Filter products by attribute values
				allMatchingProducts = allMatchingProducts.filter((product) => {
					if (!product.productAttributes) return false;

					try {
						const parsed = JSON.parse(product.productAttributes);
						let productAttrs: Array<{ attributeId: string; value: string }> =
							[];

						// Handle both object and array formats
						if (typeof parsed === "object" && parsed !== null) {
							if (Array.isArray(parsed)) {
								productAttrs = parsed;
							} else {
								// Convert object to array format
								productAttrs = Object.entries(parsed).map(([key, value]) => ({
									attributeId: key,
									value: String(value),
								}));
							}
						}

						// Check if product matches all attribute filters
						for (const [attributeId, _valueIds] of Object.entries(
							attributeFilters,
						)) {
							const attrIdNum = parseInt(attributeId, 10);
							if (Number.isNaN(attrIdNum)) continue;

							const expectedValues = attributeValueMap.get(attrIdNum);
							if (!expectedValues || expectedValues.size === 0) continue;

							// Find product's attribute value
							const productAttr = productAttrs.find((attr) => {
								const numericId = parseInt(attr.attributeId, 10);
								if (!Number.isNaN(numericId) && numericId === attrIdNum) {
									return true;
								}
								const slug = attributeIdToSlug.get(attrIdNum);
								return slug && attr.attributeId === slug;
							});

							if (!productAttr) return false;

							// Check if product's value matches any of the selected values
							const productValues = productAttr.value
								.split(",")
								.map((v) => v.trim())
								.filter(Boolean);

							const hasMatch = productValues.some((pv) =>
								expectedValues.has(pv),
							);
							if (!hasMatch) return false;
						}

						return true;
					} catch {
						// Invalid JSON, exclude product
						return false;
					}
				});

				// Get product IDs after attribute filtering
				const filteredProductIds = new Set(
					allMatchingProducts.map((p) => p.id),
				);

				// Update where condition to include product IDs
				if (filteredProductIds.size > 0) {
					conditions.push(inArray(products.id, Array.from(filteredProductIds)));
				} else {
					// No products match, return empty result
					conditions.push(sql`1 = 0`);
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

			// Build products query with conditional pagination
			const productsQuery = db
				.select()
				.from(products)
				.where(finalWhereCondition)
				.orderBy(orderSql);

			const productsResult =
				offsetValue !== undefined && pageLimit
					? await productsQuery.limit(pageLimit).offset(offsetValue).all()
					: await productsQuery.all();

			// Get product IDs from current page
			const activeProductIds = new Set(productsResult.map((p) => p.id));

			// Fetch ONLY variations for the current page of products (not all variations in DB)
			const filteredVariations =
				activeProductIds.size > 0
					? await db
							.select()
							.from(productVariations)
							.where(
								inArray(
									productVariations.productId,
									Array.from(activeProductIds),
								),
							)
							.all()
					: [];

			// Get variation IDs from the filtered variations
			const activeVariationIds = new Set(filteredVariations.map((v) => v.id));

			// Fetch ONLY attributes for these specific variations (not all attributes in DB)
			const filteredAttributes =
				activeVariationIds.size > 0
					? await db
							.select()
							.from(variationAttributes)
							.where(
								inArray(
									variationAttributes.productVariationId,
									Array.from(activeVariationIds),
								),
							)
							.all()
					: [];

			const variationsByProduct = new Map<
				number,
				(typeof productVariations.$inferSelect)[]
			>();
			filteredVariations.forEach((variation) => {
				if (variation.productId) {
					if (!variationsByProduct.has(variation.productId)) {
						variationsByProduct.set(variation.productId, []);
					}
					variationsByProduct.get(variation.productId)?.push(variation);
				}
			});

			const attributesByVariation = new Map<
				number,
				(typeof variationAttributes.$inferSelect)[]
			>();
			filteredAttributes.forEach((attr) => {
				if (attr.productVariationId) {
					if (!attributesByVariation.has(attr.productVariationId)) {
						attributesByVariation.set(attr.productVariationId, []);
					}
					const existingAttributes = attributesByVariation.get(
						attr.productVariationId,
					);
					if (existingAttributes) {
						existingAttributes.push(attr);
					}
				}
			});

			const productsArray = productsResult.map((product) => {
				const variations = variationsByProduct.get(product.id) || [];

				const variationsWithAttributes = variations
					.map((variation) => ({
						...variation,
						attributes: attributesByVariation.get(variation.id) || [],
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

				// Process productAttributes - convert JSON string to array
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

				// Process tags - convert JSON string to array
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
