import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { eq, inArray, isNull, like, or, type SQL, sql } from "drizzle-orm";
import { DB } from "~/db";
import {
	attributeValues,
	productAttributes,
	products,
	productVariations,
	variationAttributes,
} from "~/schema";
import type {
	ProductVariationWithAttributes,
	ProductWithVariations,
} from "~/types";
import { buildFts5Query } from "~/utils/search/queryExpander";

// Type for the joined query result
type JoinedQueryResult = {
	products: typeof products.$inferSelect;
	product_variations: typeof productVariations.$inferSelect | null;
	variation_attributes: typeof variationAttributes.$inferSelect | null;
};

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
				normalizedSearch && normalizedSearch.length >= 2
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

			// Store FTS result IDs separately for ordering
			let ftsProductIds: number[] | undefined;

			if (effectiveSearch) {
				// Use FTS5 for search (trigram tokenizer handles fuzzy matching)
				const ftsQuery = buildFts5Query(effectiveSearch, {
					enablePrefixMatch: true,
					operator: "AND",
				});

				if (ftsQuery) {
					try {
						// Query FTS5 table for matching product IDs
						// ORDER BY rank ensures most relevant results appear first
						const ftsResults = await db.all<{ id: number }>(
							sql`SELECT rowid as id FROM products_fts WHERE products_fts MATCH ${ftsQuery} ORDER BY rank`,
						);

						ftsProductIds = ftsResults.map((r) => r.id);

						// Filter products by FTS results
						if (ftsProductIds && ftsProductIds.length > 0) {
							conditions.push(inArray(products.id, ftsProductIds));
						} else {
							// No matches - return empty result
							conditions.push(sql`1=0`);
						}
					} catch (error) {
						console.error("FTS5 search error, falling back to LIKE:", error);
						// Fallback to LIKE search if FTS5 fails
						// Note: Only search fields that are indexed in FTS5
						const searchTerm = effectiveSearch.toLowerCase();
						const searchPattern = `%${searchTerm}%`;
						conditions.push(
							or(
								like(sql`LOWER(${products.name})`, searchPattern),
								like(sql`LOWER(${products.sku})`, searchPattern),
							) ?? sql`1=0`,
						);
					}
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
				// Get attribute slugs and value mappings
				const allAttributes = await db.select().from(productAttributes);
				const attributeIdToSlug = new Map<number, string>();
				for (const attr of allAttributes) {
					attributeIdToSlug.set(attr.id, attr.slug);
				}

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

			// Build the products query with conditional pagination
			// Build a paged subquery to avoid large IN() parameter lists and ensure correct pagination
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
				// Use FTS5 relevance order when search is active
				// Create CASE statement to maintain FTS rank order
				const caseStatements = ftsProductIds
					.map((id, index) => `WHEN ${products.id.name} = ${id} THEN ${index}`)
					.join(" ");
				orderSql = sql.raw(`CASE ${caseStatements} ELSE 9999 END`);
			} else if (effectiveSearch) {
				// Fallback for non-FTS search
				orderSql = sql`instr(lower(${products.name}), ${effectiveSearch.toLowerCase()}), ${products.name}`;
			}

			const subquery = sql`select ${products.id} from ${products}
				where ${finalWhereCondition}
				order by ${orderSql}
				limit ${hasPagination ? pageLimit : totalCount}
				offset ${hasPagination ? offsetValue : 0}`;

			const baseQuery = db
				.select()
				.from(products)
				.leftJoin(
					productVariations,
					eq(productVariations.productId, products.id),
				)
				.leftJoin(
					variationAttributes,
					eq(variationAttributes.productVariationId, productVariations.id),
				)
				.where(sql`${products.id} in (${subquery})`)
				.orderBy(orderSql);

			// Apply pagination if provided
			const rows: JoinedQueryResult[] = await baseQuery.all();

			// Allow empty state: don't error when there are no products yet

			// Group products and build variations
			const productMap = new Map<number, ProductWithVariations>();
			const variationMap = new Map<number, ProductVariationWithAttributes>();

			for (const row of rows || []) {
				const product = row.products;
				const variation = row.product_variations;
				const attribute = row.variation_attributes;

				// Initialize product if not exists
				if (!productMap.has(product.id)) {
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

					productMap.set(product.id, {
						...product,
						images: imagesString,
						productAttributes: JSON.stringify(productAttributesArray),
						tags: JSON.stringify(tagsArray),
						variations: [],
					});
				}

				const currentProduct = productMap.get(product.id);
				if (!currentProduct) {
					continue; // Skip if product not found in map
				}

				// Process variations if product has them
				if (variation) {
					// Initialize variation if not exists
					if (!variationMap.has(variation.id)) {
						variationMap.set(variation.id, {
							id: variation.id,
							productId: variation.productId,
							sku: variation.sku,
							price: variation.price,
							sort: variation.sort,
							discount: variation.discount,
							createdAt: variation.createdAt,
							attributes: [],
						});
					}

					// Add attribute to variation if exists
					if (attribute) {
						const currentVariation = variationMap.get(variation.id);
						if (!currentVariation) continue;
						const existingAttribute = currentVariation.attributes.find(
							(attr) => attr.attributeId === attribute.attributeId,
						);

						if (!existingAttribute) {
							currentVariation.attributes.push({
								attributeId: attribute.attributeId,
								value: attribute.value,
							});
						}
					}
				}
			}

			// Assign variations to products
			for (const variation of variationMap.values()) {
				const productId = rows.find(
					(row) => row.product_variations?.id === variation.id,
				)?.products.id;
				if (productId) {
					const product = productMap.get(productId);
					if (
						product &&
						!product.variations?.find((v) => v.id === variation.id)
					) {
						product.variations?.push(variation);
					}
				}
			}

			// Sort variations by sort field
			for (const product of productMap.values()) {
				product.variations?.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
			}

			// Preserve database ordering for relevance or name ordering
			const productsArray = Array.from(productMap.values());

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
