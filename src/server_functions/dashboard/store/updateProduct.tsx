import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { DB } from "~/db";
import type * as schema from "~/schema";
import { products, productVariations, variationAttributes } from "~/schema";
import type { ProductFormData } from "~/types";

export const updateProduct = createServerFn({ method: "POST" })
	.inputValidator((data: { id: number; data: ProductFormData }) => data)
	.handler(async ({ data }) => {
		try {
			const db: DrizzleD1Database<typeof schema> = DB();
			const { id: productId, data: productData } = data;

			if (Number.isNaN(productId)) {
				setResponseStatus(400);
				throw new Error("Invalid product ID");
			}

			if (!productData.name || !productData.slug || !productData.price) {
				setResponseStatus(400);
				throw new Error(
					"Missing required fields: name, slug, and price are required",
				);
			}

			// Fetch existing product and check for duplicate slug
			const [existingProduct, duplicateSlug] = await Promise.all([
				db.select().from(products).where(eq(products.id, productId)).limit(1),
				db
					.select()
					.from(products)
					.where(eq(products.slug, productData.slug))
					.limit(1),
			]);

			if (!existingProduct[0]) {
				setResponseStatus(404);
				throw new Error("Product not found");
			}

			if (duplicateSlug[0] && duplicateSlug[0].id !== productId) {
				setResponseStatus(400);
				throw new Error("A product with this slug already exists");
			}

			// Process images - convert comma-separated string to JSON array
			// Use the provided images string directly, even if empty (to allow removing all images)
			const imageString = productData.images?.trim() ?? "";
			const imagesArray = imageString
				? imageString
						.split(",")
						.map((img) => img.trim())
						.filter(Boolean)
				: [];
			const imagesJson =
				imagesArray.length > 0 ? JSON.stringify(imagesArray) : "";

			// Update product and related data
			await Promise.all([
				// Update main product
				db
					.update(products)
					.set({
						name: productData.name,
						slug: productData.slug,
						description: productData.description || null,
						price: parseFloat(productData.price),
						squareMetersPerPack: productData.squareMetersPerPack
							? parseFloat(productData.squareMetersPerPack)
							: null,
						categorySlug: productData.categorySlug || null,
						brandSlug: productData.brandSlug || null,
						collectionSlug: productData.collectionSlug || null,
						stock: parseInt(productData.stock, 10),
						isActive: productData.isActive,
						isFeatured: productData.isFeatured,
						discount: productData.discount || null,
						hasVariations: productData.hasVariations,
						images: imagesJson,
						productAttributes: productData.attributes?.length
							? JSON.stringify(productData.attributes)
							: null,
					})
					.where(eq(products.id, productId)),

				// Handle variations
				(async () => {
					if (productData.hasVariations && productData.variations?.length) {
						// Get all existing variations for this product
						const existingVariations = await db
							.select()
							.from(productVariations)
							.where(eq(productVariations.productId, productId));

						// Delete old variations and their attributes
						if (existingVariations.length > 0) {
							// Delete variation attributes for all variations
							for (const variation of existingVariations) {
								await db
									.delete(variationAttributes)
									.where(
										eq(variationAttributes.productVariationId, variation.id),
									);
							}

							// Delete variations
							await db
								.delete(productVariations)
								.where(eq(productVariations.productId, productId));
						}

						// Insert new variations and get their IDs
						const insertedVariations = await db
							.insert(productVariations)
							.values(
								productData.variations.map((v) => ({
									productId: productId,
									sku: v.sku,
									price: parseFloat(v.price.toString()),
									stock: parseInt(v.stock.toString(), 10),
									sort: v.sort || 0,
									discount: v.discount
										? parseInt(v.discount.toString(), 10)
										: null,
									createdAt: new Date(),
								})),
							)
							.returning();

						// Insert variation attributes if they exist
						const attributesToInsert = productData.variations.flatMap(
							(variation, index) => {
								const insertedVariation = insertedVariations[index];
								return (
									variation.attributes?.map((attr) => ({
										productVariationId: insertedVariation.id,
										attributeId: attr.attributeId,
										value: attr.value,
										createdAt: new Date(),
									})) || []
								);
							},
						);

						if (attributesToInsert.length > 0) {
							await db.insert(variationAttributes).values(attributesToInsert);
						}
					} else {
						// If no variations, clean up any existing ones
						const existingVariations = await db
							.select()
							.from(productVariations)
							.where(eq(productVariations.productId, productId));

						if (existingVariations.length > 0) {
							// Delete variation attributes for all variations
							for (const variation of existingVariations) {
								await db
									.delete(variationAttributes)
									.where(
										eq(variationAttributes.productVariationId, variation.id),
									);
							}

							await db
								.delete(productVariations)
								.where(eq(productVariations.productId, productId));
						}
					}
				})(),
			]);

			// Fetch and return updated product
			const updatedProduct = await db
				.select()
				.from(products)
				.where(eq(products.id, productId))
				.limit(1);

			return {
				message: "Product updated successfully",
				product: updatedProduct[0],
			};
		} catch (error) {
			console.error("Error updating product:", error);
			setResponseStatus(500);
			throw new Error("Failed to update product");
		}
	});
