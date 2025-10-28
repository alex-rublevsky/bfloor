import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { DB } from "~/db";
import type * as schema from "~/schema";
import {
	products,
	productVariations,
	variationAttributes,
} from "~/schema";
import type { Product, ProductVariation } from "~/types";

// Type for variation attributes from database result
type VariationAttributeResult = {
	id: number;
	productVariationId: number | null;
	attributeId: string;
	value: string;
	createdAt: Date;
};
// GET server function with pagination support
export const getStoreData = createServerFn({ method: "GET" })
	.inputValidator((data: { page?: number; limit?: number } = {}) => data)
	.handler(async ({ data = {} }) => {
		try {
			const db: DrizzleD1Database<typeof schema> = DB();
			const { page, limit: pageLimit } = data;

			// Calculate pagination if provided
			const offsetValue = page && pageLimit ? (page - 1) * pageLimit : undefined;

			// Get total count for pagination
			const totalCountResult = await db
				.select({ count: products.id })
				.from(products)
				.where(eq(products.isActive, true))
				.all();
			const totalCount = totalCountResult.length;

			// Build products query with conditional pagination
			const productsQuery = db
				.select()
				.from(products)
				.where(eq(products.isActive, true));

		const productsResult = offsetValue !== undefined && pageLimit
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
		if (page !== undefined && pageLimit !== undefined && offsetValue !== undefined) {
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
