import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { DB } from "~/db";
import type * as schema from "~/schema";
import {
	categories,
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
// GET server function that mirrors the former /api/store route behavior exactly
export const getStoreData = createServerFn({ method: "GET" }).handler(
	async () => {
		try {
			const db: DrizzleD1Database<typeof schema> = DB();

			const [categoriesResult, productsResult] = await Promise.all([
				db.select().from(categories),
				db.select().from(products).where(eq(products.isActive, true)),
			]);

			// Allow empty state for initial setup

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

			return {
				products: productsArray,
				categories: categoriesResult,
			};
		} catch (error) {
			console.error("Error fetching store data:", error);
			setResponseStatus(500);
			throw new Error("Failed to fetch store data");
		}
	},
);
