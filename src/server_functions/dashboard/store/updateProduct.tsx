import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { eq, inArray } from "drizzle-orm";
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

			// Fetch existing product and check for duplicate slug
			// Note: SKU duplicates are allowed since SKU is optional and not unique in the schema
			const normalizedSku = productData.sku?.trim() || null;

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

			// SKU duplicate check is intentionally removed - duplicate SKUs are allowed

			// Process images - convert comma-separated string to JSON array
			const imagesArray =
				productData.images
					?.split(",")
					.map((img) => img.trim())
					.filter(Boolean) ?? [];
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
			const attributesObject = productData.attributes?.reduce(
				(acc, attr) => {
					if (attr.value?.trim()) {
						acc[attr.attributeId] = attr.value;
					}
					return acc;
				},
				{} as Record<string, string>,
			);
			const attributesJson =
				attributesObject && Object.keys(attributesObject).length > 0
					? JSON.stringify(attributesObject)
					: null;

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

			// Validate and prepare variations before any database changes
			// This prevents data loss if validation fails
			const shouldHaveVariations = productData.hasVariations === true;
			const incomingVariations = shouldHaveVariations
				? productData.variations || []
				: [];

			// Validate variation data if variations are provided
			if (incomingVariations.length > 0) {
				// Validate basic variation fields
				for (const [index, variation] of incomingVariations.entries()) {
					const price = parseFloat(variation.price.toString());
					if (Number.isNaN(price) || price < 0) {
						setResponseStatus(400);
						throw new Error(
							`Variation ${index + 1}: Invalid price. Must be a non-negative number`,
						);
					}

					if (variation.discount !== null && variation.discount !== undefined) {
						const discount = parseInt(variation.discount.toString(), 10);
						if (Number.isNaN(discount) || discount < 0 || discount > 100) {
							setResponseStatus(400);
							throw new Error(
								`Variation ${index + 1}: Invalid discount. Must be between 0 and 100`,
							);
						}
					}
				}

				// Check for duplicate IDs within incoming variations (shouldn't happen, but safety check)
				const incomingIds = incomingVariations
					.map((v) => v.id)
					.filter((id): id is number => id !== undefined);
				const duplicateIds = incomingIds.filter(
					(id, index) => incomingIds.indexOf(id) !== index,
				);
				if (duplicateIds.length > 0) {
					setResponseStatus(400);
					throw new Error(
						`Duplicate variation IDs found: ${[...new Set(duplicateIds)].join(", ")}`,
					);
				}

				// Validate variation attributes
				const allVariationAttributes = incomingVariations.flatMap(
					(v) => v.attributes || [],
				);
				if (allVariationAttributes.length > 0) {
					const validationErrors = await validateAttributeValues(
						db,
						allVariationAttributes,
					);

					if (validationErrors.length > 0) {
						setResponseStatus(400);
						const errorMessages = validationErrors
							.map((err) => err.error)
							.join("; ");
						throw new Error(
							`Ошибки валидации атрибутов вариаций: ${errorMessages}`,
						);
					}
				}
			}

			// Fetch existing variations with their attributes for efficient comparison
			const existingVariationsWithAttrs = await db
				.select({
					variation: productVariations,
					attribute: variationAttributes,
				})
				.from(productVariations)
				.leftJoin(
					variationAttributes,
					eq(variationAttributes.productVariationId, productVariations.id),
				)
				.where(eq(productVariations.productId, productId));

			// Group existing variations by ID with their attributes
			const existingVariationsMap = new Map<
				number,
				{
					variation: typeof productVariations.$inferSelect;
					attributes: Array<{
						attributeId: string;
						value: string;
					}>;
				}
			>();

			for (const row of existingVariationsWithAttrs) {
				const varId = row.variation.id;
				if (!existingVariationsMap.has(varId)) {
					existingVariationsMap.set(varId, {
						variation: row.variation,
						attributes: [],
					});
				}
				if (row.attribute) {
					const variationData = existingVariationsMap.get(varId);
					if (variationData) {
						variationData.attributes.push({
							attributeId: row.attribute.attributeId,
							value: row.attribute.value,
						});
					}
				}
			}

			// Separate incoming variations into updates and inserts
			const variationsToUpdate: Array<{
				id: number;
				data: Omit<typeof productVariations.$inferInsert, "createdAt" | "id">;
				attributes: Array<{ attributeId: string; value: string }>;
			}> = [];
			const variationsToInsert: Array<{
				data: typeof productVariations.$inferInsert;
				attributes: Array<{ attributeId: string; value: string }>;
			}> = [];

			for (const incomingVar of incomingVariations) {
				const varAttributes = incomingVar.attributes || [];
				// Normalize SKU: allow empty strings or null (SKU is optional)
				const normalizedSku = incomingVar.sku?.trim() || "";
				const price = parseFloat(incomingVar.price.toString());
				const discount =
					incomingVar.discount !== null && incomingVar.discount !== undefined
						? parseInt(incomingVar.discount.toString(), 10)
						: null;

				// If variation has an ID and exists in this product, it's an update
				if (incomingVar.id && existingVariationsMap.has(incomingVar.id)) {
					// Verify the variation belongs to this product (security check)
					const existingVar = existingVariationsMap.get(incomingVar.id);
					if (existingVar && existingVar.variation.productId !== productId) {
						setResponseStatus(400);
						throw new Error(
							`Variation ID ${incomingVar.id} does not belong to this product`,
						);
					}

					// For updates, exclude createdAt to preserve original creation time
					const updateData = {
						productId,
						sku: normalizedSku,
						price,
						sort: incomingVar.sort || 0,
						discount,
					};
					variationsToUpdate.push({
						id: incomingVar.id,
						data: updateData,
						attributes: varAttributes,
					});
				} else {
					// No ID or ID doesn't exist = new variation
					const insertData = {
						productId,
						sku: normalizedSku,
						price,
						sort: incomingVar.sort || 0,
						discount,
						createdAt: new Date(),
					};
					variationsToInsert.push({
						data: insertData,
						attributes: varAttributes,
					});
				}
			}

			// Determine which existing variations should be deleted
			// Delete if: hasVariations is false OR variation ID not in incoming list
			const incomingVariationIds = new Set(
				incomingVariations
					.map((v) => v.id)
					.filter((id): id is number => id !== undefined),
			);
			const variationsToDelete = Array.from(
				existingVariationsMap.keys(),
			).filter((id) => !shouldHaveVariations || !incomingVariationIds.has(id));

			// Update product and related data
			await Promise.all([
				// Update main product
				db
					.update(products)
					.set({
						name: productData.name,
						slug: productData.slug,
						sku: normalizedSku,
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

				// Handle variations efficiently: update, insert, delete only what's needed
				(async () => {
					// Update existing variations in parallel for better performance
					if (variationsToUpdate.length > 0) {
						// Batch delete all attributes for variations being updated
						const updatingVariationIds = variationsToUpdate.map((v) => v.id);
						if (updatingVariationIds.length > 0) {
							await db
								.delete(variationAttributes)
								.where(
									inArray(
										variationAttributes.productVariationId,
										updatingVariationIds,
									),
								);
						}

						// Update variations and insert attributes in parallel
						await Promise.all([
							// Update all variations in parallel
							...variationsToUpdate.map(({ id, data }) =>
								db
									.update(productVariations)
									.set(data)
									.where(eq(productVariations.id, id)),
							),
							// Insert all attributes in parallel (if any)
							(async () => {
								const allAttributesToInsert = variationsToUpdate.flatMap(
									({ id, attributes }) =>
										attributes.map((attr) => ({
											productVariationId: id,
											attributeId: attr.attributeId,
											value: attr.value,
											createdAt: new Date(),
										})),
								);

								if (allAttributesToInsert.length > 0) {
									await db
										.insert(variationAttributes)
										.values(allAttributesToInsert);
								}
							})(),
						]);
					}

					// Insert new variations
					if (variationsToInsert.length > 0) {
						const insertedVariations = await db
							.insert(productVariations)
							.values(variationsToInsert.map((v) => v.data))
							.returning();

						// Insert attributes for new variations
						const attributesToInsert = variationsToInsert.flatMap(
							(variation, index) =>
								variation.attributes.map((attr) => ({
									productVariationId: insertedVariations[index].id,
									attributeId: attr.attributeId,
									value: attr.value,
									createdAt: new Date(),
								})),
						);

						if (attributesToInsert.length > 0) {
							await db.insert(variationAttributes).values(attributesToInsert);
						}
					}

					// Delete variations that are no longer needed
					if (variationsToDelete.length > 0) {
						// Delete attributes first (cascade should handle this, but being explicit)
						await db
							.delete(variationAttributes)
							.where(
								inArray(
									variationAttributes.productVariationId,
									variationsToDelete,
								),
							);

						// Delete variations
						await db
							.delete(productVariations)
							.where(inArray(productVariations.id, variationsToDelete));
					}
				})(),

				// Handle store location connections
				(async () => {
					// Delete existing connections
					await db
						.delete(productStoreLocations)
						.where(eq(productStoreLocations.productId, productId));

					// Add new connections if provided
					if (productData.storeLocationIds?.length) {
						await db.insert(productStoreLocations).values(
							productData.storeLocationIds.map((locationId: number) => ({
								productId,
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
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.error("Error updating product:", { errorMessage, error });
			setResponseStatus(500);
			throw new Error(`Failed to update product: ${errorMessage}`);
		}
	});
