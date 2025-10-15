import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { DB } from "~/db";
import {
	products,
	productTeaCategories,
	productVariations,
	type schema,
	variationAttributes,
} from "~/schema";

export const deleteProduct = createServerFn({ method: "POST" })
	.inputValidator((data: { id: number }) => data)
	.handler(async ({ data }) => {
		try {
			const db: DrizzleD1Database<typeof schema> = DB();
			const productId = data.id;

			if (Number.isNaN(productId)) {
				setResponseStatus(400);
				throw new Error("Invalid product ID");
			}

			// Check if product exists
			const existingProduct = await db
				.select()
				.from(products)
				.where(eq(products.id, productId))
				.limit(1);

			if (!existingProduct[0]) {
				setResponseStatus(404);
				throw new Error("Product not found");
			}

			// Delete related data first (foreign key constraints)

			// Get all variations for this product
			const existingVariations = await db
				.select()
				.from(productVariations)
				.where(eq(productVariations.productId, productId));

			// Delete variation attributes for all variations
			if (existingVariations.length > 0) {
				for (const variation of existingVariations) {
					await db
						.delete(variationAttributes)
						.where(eq(variationAttributes.productVariationId, variation.id));
				}

				// Delete variations
				await db
					.delete(productVariations)
					.where(eq(productVariations.productId, productId));
			}

			// Delete tea category associations
			await db
				.delete(productTeaCategories)
				.where(eq(productTeaCategories.productId, productId));

			// Finally delete the product
			await db.delete(products).where(eq(products.id, productId));

			return {
				message: "Product deleted successfully",
			};
		} catch (error) {
			console.error("Error deleting product:", error);
			setResponseStatus(500);
			throw new Error("Failed to delete product");
		}
	});
