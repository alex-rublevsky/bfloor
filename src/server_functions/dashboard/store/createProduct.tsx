import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { DB } from "~/db";
import { products, productVariations, variationAttributes } from "~/schema";
import type { ProductFormData } from "~/types";

export const createProduct = createServerFn({ method: "POST" })
	.inputValidator((data: ProductFormData) => data)
	.handler(async ({ data }) => {
		try {
			const db = DB();
			const productData = data;

			if (!productData.name || !productData.slug || !productData.price) {
				setResponseStatus(400);
				throw new Error(
					"Missing required fields: name, slug, and price are required",
				);
			}

			// Check for duplicate slug
			const duplicateSlug = await db
				.select()
				.from(products)
				.where(eq(products.slug, productData.slug))
				.limit(1);

			if (duplicateSlug[0]) {
				setResponseStatus(400);
				throw new Error("A product with this slug already exists");
			}

			// Process images - convert comma-separated string to JSON array
			const imageString = productData.images?.trim() || "";
			const imagesArray = imageString
				? imageString
						.split(",")
						.map((img) => img.trim())
						.filter(Boolean)
				: [];
			const imagesJson =
				imagesArray.length > 0 ? JSON.stringify(imagesArray) : "";

			// Insert main product
			const insertedProducts = await db
				.insert(products)
				.values({
					name: productData.name,
					slug: productData.slug,
					description: productData.description || null,
					importantNote: productData.importantNote || null,
					tags: productData.tags?.length ? JSON.stringify(productData.tags) : null,
					price: parseFloat(productData.price),
					squareMetersPerPack: productData.squareMetersPerPack
						? parseFloat(productData.squareMetersPerPack)
						: null,
					unitOfMeasurement: productData.unitOfMeasurement,
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
					createdAt: new Date(),
				})
				.returning();

			const newProduct = insertedProducts[0];

			// Handle variations
			if (productData.hasVariations && productData.variations?.length) {
				// Insert variations and get their IDs
				const insertedVariations = await db
					.insert(productVariations)
					.values(
						productData.variations.map((v) => ({
							productId: newProduct.id,
							sku: v.sku,
							price: parseFloat(v.price.toString()),
							stock: parseInt(v.stock.toString(), 10),
							sort: v.sort || 0,
							discount: v.discount ? parseInt(v.discount.toString(), 10) : null,
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
			}

			return {
				message: "Product created successfully",
				product: newProduct,
			};
		} catch (error) {
			console.error("Error creating product:", error);
			setResponseStatus(500);
			throw new Error("Failed to create product");
		}
	});
