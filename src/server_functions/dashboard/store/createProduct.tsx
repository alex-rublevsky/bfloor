import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { DB } from "~/db";
import {
	productStoreLocations,
	products,
	productVariations,
	variationAttributes,
} from "~/schema";
import type { ProductFormData } from "~/types";
import { validateAttributeValues } from "~/utils/validateAttributeValues";

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

			if (!productData.unitOfMeasurement) {
				setResponseStatus(400);
				throw new Error("Unit of measurement is required");
			}

			// Check for duplicate slug and SKU
			const [duplicateSlug, duplicateSku] = await Promise.all([
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

			if (duplicateSlug[0]) {
				setResponseStatus(400);
				throw new Error("A product with this slug already exists");
			}

			if (duplicateSku[0]) {
				setResponseStatus(400);
				throw new Error("A product with this SKU already exists");
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
			setResponseStatus(500);
			throw new Error("Failed to create product");
		}
	});
