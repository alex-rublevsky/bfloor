import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { DB } from "~/db";
import {
	productAttributes,
	products,
	productStoreLocations,
	productVariations,
	variationAttributes,
} from "~/schema";
import type { ProductFormData } from "~/types";
import { getStorageBucket } from "~/utils/storage";
import { validateAttributeValues } from "~/utils/validateAttributeValues";
import { moveStagingImages } from "./moveStagingImages";

export const createProduct = createServerFn({ method: "POST" })
	.inputValidator((data: ProductFormData) => data)
	.handler(async ({ data }) => {
		// Track moved images for cleanup on error (declared outside try for catch access)
		let movedImagePaths: string[] = [];

		try {
			const db = DB();
			const productData = data;

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

			// Check for duplicate slug only
			// Note: SKU duplicates are allowed since SKU is optional and not unique in the schema
			const duplicateSlug = await db
				.select()
				.from(products)
				.where(eq(products.slug, productData.slug))
				.limit(1);

			if (duplicateSlug[0]) {
				setResponseStatus(400);
				throw new Error("A product with this slug already exists");
			}

			// Validate standardized attribute values BEFORE moving images
			// This prevents orphaned images if validation fails
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

			// Process images - move staging images to final location after validation passes
			let imageString = productData.images?.trim() || "";

			// Parse image paths and move staging images to final location
			if (imageString) {
				const imagePaths = imageString
					.split(",")
					.map((img) => img.trim())
					.filter(Boolean);

				// Check if any images are in staging
				const hasStagingImages = imagePaths.some((path) =>
					path.startsWith("staging/"),
				);

				if (hasStagingImages) {
					// Move staging images to final location
					const moveResult = await moveStagingImages({
						data: {
							imagePaths,
							finalFolder: "products",
							categorySlug: productData.categorySlug,
							productName: productData.name,
							slug: productData.slug,
						},
					});

					if (moveResult?.pathMap) {
						// Update image string with final paths
						const updatedPaths = imagePaths.map(
							(path) => moveResult.pathMap?.[path] || path,
						);
						imageString = updatedPaths.join(", ");
						// Track moved images for potential cleanup
						movedImagePaths = Object.values(moveResult.pathMap);
					}
				}
			}

			// Convert comma-separated string to JSON array
			const imagesArray = imageString
				? imageString
						.split(",")
						.map((img) => img.trim())
						.filter(Boolean)
				: [];
			const imagesJson =
				imagesArray.length > 0 ? JSON.stringify(imagesArray) : "";

			// Convert attributes array back to object format for database storage
			// Format: { "attribute-slug": ["value1", "value2"] }
			let attributesJson = null;
			if (productData.attributes?.length) {
				// Fetch all attributes to get slug mapping
				const allAttributes = await db.select().from(productAttributes).all();
				const idToSlugMap = new Map<string, string>();
				for (const attr of allAttributes) {
					idToSlugMap.set(attr.id.toString(), attr.slug);
				}

				const attributesObject: Record<string, string[]> = {};
				for (const attr of productData.attributes) {
					if (attr.value && attr.value.trim() !== "") {
						// Convert attribute ID to slug
						const slug = idToSlugMap.get(attr.attributeId) || attr.attributeId;

						// Split comma-separated values and store as array
						const values = attr.value
							.split(",")
							.map((v) => v.trim())
							.filter(Boolean);

						if (values.length > 0) {
							attributesObject[slug] = values;
						}
					}
				}

				attributesJson =
					Object.keys(attributesObject).length > 0
						? JSON.stringify(attributesObject)
						: null;
			}

			// Insert main product
			const insertedProducts = await db
				.insert(products)
				.values({
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
					unitOfMeasurement: productData.unitOfMeasurement,
					categorySlug: productData.categorySlug || null,
					brandSlug: productData.brandSlug || null,
					collectionSlug: productData.collectionSlug || null,
					storeLocationId: productData.storeLocationId || null,
					isActive: productData.isActive,
					isFeatured: productData.isFeatured,
					discount: productData.discount || null,
					hasVariations: productData.hasVariations,
					images: imagesJson,
					productAttributes: attributesJson,
					dimensions: productData.dimensions || null,
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

			// Handle store location connections
			if (
				productData.storeLocationIds &&
				productData.storeLocationIds.length > 0
			) {
				await db.insert(productStoreLocations).values(
					productData.storeLocationIds.map((locationId: number) => ({
						productId: newProduct.id,
						storeLocationId: locationId,
						createdAt: new Date(),
					})),
				);
			}

			return {
				message: "Product created successfully",
				product: newProduct,
			};
		} catch (error) {
			console.error("Error creating product:", error);

			// Cleanup: If images were moved but product creation failed, delete the moved images
			// This prevents orphaned images in the final location
			if (movedImagePaths.length > 0) {
				try {
					const bucket = getStorageBucket();
					await Promise.allSettled(
						movedImagePaths.map(async (imagePath) => {
							try {
								await bucket.delete(imagePath);
								console.log(`Cleaned up orphaned image: ${imagePath}`);
							} catch (deleteError) {
								console.warn(
									`Failed to cleanup orphaned image ${imagePath}:`,
									deleteError,
								);
							}
						}),
					);
				} catch (cleanupError) {
					console.error("Error during image cleanup:", cleanupError);
					// Don't throw - cleanup failure shouldn't mask the original error
				}
			}

			// Preserve the original error message if it's a validation error
			if (
				error instanceof Error &&
				error.message.includes("Ошибки валидации")
			) {
				setResponseStatus(400);
				throw error;
			}

			setResponseStatus(500);
			throw new Error(
				error instanceof Error ? error.message : "Failed to create product",
			);
		}
	});
