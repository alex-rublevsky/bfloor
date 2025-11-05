import { env } from "cloudflare:workers";
import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { DB } from "~/db";
import {
	products,
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

			// Delete images from R2 if they exist
			if (existingProduct[0].images) {
				try {
					let imageArray: string[] = [];
					try {
						// Try to parse as JSON
						imageArray = JSON.parse(existingProduct[0].images);
					} catch {
						// If it's not JSON, treat it as comma-separated string
						imageArray = existingProduct[0].images
							.split(",")
							.map((img) => img.trim())
							.filter(Boolean);
					}

					if (imageArray.length > 0) {
						const bucket = env.BFLOOR_STORAGE as R2Bucket;
						if (bucket) {
							// Delete all images associated with this product
							await Promise.all(
								imageArray.map(async (imagePath) => {
									try {
										await bucket.delete(imagePath);
									} catch (error) {
										// Log but don't fail if image deletion fails
										console.warn(`Failed to delete image ${imagePath}:`, error);
									}
								}),
							);
						}
					}
				} catch (error) {
					// Log but don't fail if image deletion fails
					console.warn("Failed to delete images from R2:", error);
				}
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
