import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { DB } from "~/db";
import {
	products,
	productStoreLocations,
	productVariations,
	variationAttributes,
} from "~/schema";
import type { ProductFormData } from "~/types"; // Updated interface
import { validateAttributeValues } from "~/utils/validateAttributeValues";

export const updateProduct = createServerFn({ method: "POST" })
	.inputValidator((data: { id: number; data: ProductFormData }) => data)
	.handler(async ({ data }) => {
		try {
			const db = DB();
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

			if (!productData.unitOfMeasurement) {
				setResponseStatus(400);
				throw new Error("Unit of measurement is required");
			}

			// Fetch existing product and check for duplicate slug and SKU
			const [existingProduct, duplicateSlug, duplicateSku] = await Promise.all([
				db.select().from(products).where(eq(products.id, productId)).limit(1),
				db
					.select()
					.from(products)
					.where(eq(products.slug, productData.slug))
					.limit(1),
				productData.sku
					? db
							.select()
							.from(products)
							.where(eq(products.sku, productData.sku))
							.limit(1)
					: Promise.resolve([]),
			]);

			if (!existingProduct[0]) {
				setResponseStatus(404);
				throw new Error("Product not found");
			}

			if (duplicateSlug[0] && duplicateSlug[0].id !== productId) {
				setResponseStatus(400);
				throw new Error("A product with this slug already exists");
			}

			if (duplicateSku[0] && duplicateSku[0].id !== productId) {
				setResponseStatus(400);
				throw new Error("A product with this SKU already exists");
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

			// Validate standardized attribute values before saving
			if (productData.attributes?.length) {
				const validationErrors = await validateAttributeValues(
					db,
					productData.attributes,
				);

				if (validationErrors.length > 0) {
					setResponseStatus(400);
					const errorMessages = validationErrors
						.map((err) => err.error)
						.join("; ");
					throw new Error(`Ошибки валидации атрибутов: ${errorMessages}`);
				}
			}

			// Convert attributes array back to object format for database storage
			let attributesJson = null;
			if (productData.attributes?.length) {
				// Convert array of {attributeId, value} to object format
				const attributesObject: Record<string, string> = {};
				productData.attributes.forEach((attr) => {
					if (attr.value && attr.value.trim() !== "") {
						attributesObject[attr.attributeId] = attr.value;
					}
				});
				attributesJson =
					Object.keys(attributesObject).length > 0
						? JSON.stringify(attributesObject)
						: null;
			}

			// Preserve existing values for optional fields if empty strings are provided
			// This prevents accidentally clearing fields when form data contains empty strings
			// The form may send empty strings due to initialization, but we should preserve
			// existing values unless a non-empty value is explicitly provided
			const existingProductData = existingProduct[0];

			// Helper to preserve existing value if new value is empty string
			// Empty strings typically indicate form initialization, not intentional clearing
			const preserveIfEmpty = (
				newValue: string | null | undefined,
				existingValue: string | null | undefined,
			): string | null => {
				// If new value is explicitly provided (non-empty string), use it
				if (newValue && newValue.trim() !== "") {
					return newValue;
				}
				// If new value is empty string (form initialization artifact), preserve existing
				if (newValue === "") {
					return existingValue || null;
				}
				// If new value is null/undefined, allow clearing the field (explicit clear)
				return null;
			};

			// Update product and related data
			await Promise.all([
				// Update main product
				db
					.update(products)
					.set({
						name: productData.name,
						slug: productData.slug,
						sku: productData.sku || null,
						description: productData.description || null,
						importantNote: productData.importantNote || null,
						tags: productData.tags?.length
							? JSON.stringify(productData.tags)
							: null,
						price: parseFloat(productData.price),
						squareMetersPerPack: productData.squareMetersPerPack
							? parseFloat(productData.squareMetersPerPack)
							: null,
						// Preserve existing values if empty strings are provided
						categorySlug: preserveIfEmpty(
							productData.categorySlug,
							existingProductData.categorySlug,
						),
						brandSlug: preserveIfEmpty(
							productData.brandSlug,
							existingProductData.brandSlug,
						),
						collectionSlug: preserveIfEmpty(
							productData.collectionSlug,
							existingProductData.collectionSlug,
						),
						storeLocationId: productData.storeLocationId || null,
						isActive: productData.isActive,
						isFeatured: productData.isFeatured,
						discount: productData.discount || null,
						hasVariations: productData.hasVariations,
						images: imagesJson,
						productAttributes: attributesJson,
						dimensions: preserveIfEmpty(
							productData.dimensions,
							existingProductData.dimensions,
						),
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

				// Handle store location connections
				(async () => {
					// Delete existing store location connections
					await db
						.delete(productStoreLocations)
						.where(eq(productStoreLocations.productId, productId));

					// Add new store location connections if provided
					if (
						productData.storeLocationIds &&
						productData.storeLocationIds.length > 0
					) {
						await db.insert(productStoreLocations).values(
							productData.storeLocationIds.map((locationId: number) => ({
								productId: productId,
								storeLocationId: locationId,
								createdAt: new Date(),
							})),
						);
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
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			const errorStack = error instanceof Error ? error.stack : undefined;
			console.error("Error details:", { errorMessage, errorStack, error });
			setResponseStatus(500);
			throw new Error(`Failed to update product: ${errorMessage}`);
		}
	});
