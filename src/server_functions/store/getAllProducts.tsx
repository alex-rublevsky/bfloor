import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { eq, type SQL, sql } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { DB } from "~/db";
import type * as schema from "~/schema";
import { products, productVariations, variationAttributes } from "~/schema";
import type { Product, ProductVariation } from "~/types";

// Type for variation attributes from database result
type VariationAttributeResult = {
	id: number;
	productVariationId: number | null;
	attributeId: string;
	value: string;
	createdAt: Date;
};

// GET server function with pagination and filter support (same as dashboard getAllProducts but only returns active products)
export const getStoreData = createServerFn({ method: "GET" })
	.inputValidator(
		(
			data: {
				page?: number;
				limit?: number;
				search?: string;
				categorySlug?: string;
				brandSlug?: string;
				collectionSlug?: string;
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
			const db: DrizzleD1Database<typeof schema> = DB();
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
			const sort = data.sort;

			// Calculate pagination if provided
			const hasPagination =
				typeof page === "number" && typeof pageLimit === "number";
			const offsetValue = hasPagination ? (page - 1) * pageLimit : 0;

			// Build where clause (always filter by isActive, plus search + filters)
			const conditions: SQL[] = [eq(products.isActive, true)];
			if (effectiveSearch) {
				const searchPattern = `%${effectiveSearch.toLowerCase()}%`;
				conditions.push(sql`(
					LOWER(${products.name}) LIKE ${searchPattern}
					OR LOWER(${products.slug}) LIKE ${searchPattern}
					OR LOWER(${products.sku}) LIKE ${searchPattern}
					OR LOWER(${products.description}) LIKE ${searchPattern}
					OR LOWER(${products.importantNote}) LIKE ${searchPattern}
					OR LOWER(${products.brandSlug}) LIKE ${searchPattern}
					OR LOWER(${products.collectionSlug}) LIKE ${searchPattern}
					OR LOWER(${products.categorySlug}) LIKE ${searchPattern}
				)`);
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
			const whereCondition = sql.join(conditions, sql` AND `);

			// Get total count for pagination info (respecting filters)
			const totalCountResult = await db
				.select({ count: sql<number>`COUNT(*)` })
				.from(products)
				.where(whereCondition)
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
			} else if (sort === "name") {
				orderSql = sql`${products.name} asc`;
			} else if (effectiveSearch) {
				orderSql = sql`instr(lower(${products.name}), ${effectiveSearch.toLowerCase()}), ${products.name}`;
			}

			// Build products query with conditional pagination
			const productsQuery = db
				.select()
				.from(products)
				.where(whereCondition)
				.orderBy(orderSql);

			const productsResult =
				offsetValue !== undefined && pageLimit
					? await productsQuery.limit(pageLimit).offset(offsetValue).all()
					: await productsQuery.all();

			// Fetch variations and attributes in parallel
			const [variationsResult, attributesResult] = await Promise.all([
				db.select().from(productVariations),
				db.select().from(variationAttributes),
			]);

			const activeProductIds = new Set(
				productsResult.map((p: Product) => p.id),
			);
			const filteredVariations = variationsResult.filter(
				(v: ProductVariation) =>
					v.productId && activeProductIds.has(v.productId),
			);

			const activeVariationIds = new Set(
				filteredVariations.map((v: ProductVariation) => v.id),
			);
			const filteredAttributes = attributesResult.filter(
				(attr) =>
					attr.productVariationId &&
					activeVariationIds.has(attr.productVariationId),
			);

			const variationsByProduct = new Map<number, ProductVariation[]>();
			filteredVariations.forEach((variation: ProductVariation) => {
				if (variation.productId) {
					if (!variationsByProduct.has(variation.productId)) {
						variationsByProduct.set(variation.productId, []);
					}
					variationsByProduct.get(variation.productId)?.push(variation);
				}
			});

			const attributesByVariation = new Map<
				number,
				VariationAttributeResult[]
			>();
			filteredAttributes.forEach((attr: VariationAttributeResult) => {
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

			const productsArray = productsResult.map((product: Product) => {
				const variations = variationsByProduct.get(product.id) || [];

				const variationsWithAttributes = variations
					.map((variation) => ({
						...variation,
						attributes: attributesByVariation.get(variation.id) || [],
					}))
					.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));

				return {
					...product,
					variations: variationsWithAttributes,
				};
			});

			const result = {
				products: productsArray,
			};

			// Add pagination info if pagination was used
			if (
				page !== undefined &&
				pageLimit !== undefined &&
				offsetValue !== undefined
			) {
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

			return result;
		} catch (error) {
			console.error("Error fetching store data:", error);
			setResponseStatus(500);
			throw new Error("Failed to fetch store data");
		}
	});
