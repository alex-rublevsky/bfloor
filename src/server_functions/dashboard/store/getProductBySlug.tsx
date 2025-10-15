import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { DB } from "~/db";
import type * as schema from "~/schema";
import {
	products,
	productTeaCategories,
	productVariations,
	variationAttributes,
} from "~/schema";

export const getProductBySlug = createServerFn({ method: "GET" })
	.inputValidator((data: { id: number }) => data)
	.handler(async ({ data }) => {
		try {
			const db: DrizzleD1Database<typeof schema> = DB();
			const productId = data.id;

			if (Number.isNaN(productId)) {
				setResponseStatus(400);
				throw new Error("Invalid product ID");
			}

			// Fetch product with all its data
			const [productResult, variationsResult, teaCategoriesResult] =
				await Promise.all([
					db.select().from(products).where(eq(products.id, productId)).limit(1),
					db
						.select({
							id: productVariations.id,
							sku: productVariations.sku,
							price: productVariations.price,
							stock: productVariations.stock,
							sort: productVariations.sort,
							discount: productVariations.discount,
							shippingFrom: productVariations.shippingFrom,
							attributeId: variationAttributes.attributeId,
							attributeValue: variationAttributes.value,
						})
						.from(productVariations)
						.leftJoin(
							variationAttributes,
							eq(variationAttributes.productVariationId, productVariations.id),
						)
						.where(eq(productVariations.productId, productId)),
					db
						.select({
							teaCategorySlug: productTeaCategories.teaCategorySlug,
						})
						.from(productTeaCategories)
						.where(eq(productTeaCategories.productId, productId)),
				]);

			if (!productResult[0]) {
				setResponseStatus(404);
				throw new Error("Product not found");
			}

			const product = productResult[0];

			// Group variations with their attributes
			const variationsMap = new Map();
			for (const row of variationsResult) {
				if (!variationsMap.has(row.id)) {
					variationsMap.set(row.id, {
						id: row.id.toString(),
						sku: row.sku,
						price: row.price,
						stock: row.stock,
						sort: row.sort,
						discount: row.discount,
						shippingFrom: row.shippingFrom,
						attributes: [],
					});
				}

				if (row.attributeId && row.attributeValue) {
					variationsMap.get(row.id).attributes.push({
						attributeId: row.attributeId,
						value: row.attributeValue,
					});
				}
			}

			const variations = Array.from(variationsMap.values());
			const teaCategories = teaCategoriesResult.map(
				(tc: { teaCategorySlug: string }) => tc.teaCategorySlug,
			);

			const productWithDetails = {
				...product,
				variations,
				teaCategories,
			};

			return productWithDetails;
		} catch (error) {
			console.error("Error fetching product:", error);
			setResponseStatus(500);
			throw new Error("Failed to fetch product");
		}
	});
