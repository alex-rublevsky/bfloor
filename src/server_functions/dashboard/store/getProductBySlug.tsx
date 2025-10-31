import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { DB } from "~/db";
import type * as schema from "~/schema";
import { products, productVariations, variationAttributes, productStoreLocations, productAttributes } from "~/schema";

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
			const [productResult, variationsResult, storeLocationsResult] = await Promise.all([
				db.select().from(products).where(eq(products.id, productId)).limit(1),
				db
					.select({
						id: productVariations.id,
						sku: productVariations.sku,
						price: productVariations.price,
						sort: productVariations.sort,
						discount: productVariations.discount,
						attributeId: variationAttributes.attributeId,
						attributeValue: variationAttributes.value,
					})
					.from(productVariations)
					.leftJoin(
						variationAttributes,
						eq(variationAttributes.productVariationId, productVariations.id),
					)
					.where(eq(productVariations.productId, productId)),
				db.select().from(productStoreLocations).where(eq(productStoreLocations.productId, productId)),
			]);

			if (!productResult[0]) {
				setResponseStatus(404);
				throw new Error("Product not found");
			}

			const product = productResult[0];

			// Group variations with their attributes
			const variationsMap = new Map();
			
			// Fetch all available attributes to create slug-to-ID mapping
			const allAttributes = await db.select().from(productAttributes);
			const slugToIdMap: Record<string, string> = {};
			allAttributes.forEach(attr => {
				slugToIdMap[attr.slug] = attr.id.toString();
			});
			
			for (const row of variationsResult) {
				if (!variationsMap.has(row.id)) {
					variationsMap.set(row.id, {
						id: row.id.toString(),
						sku: row.sku,
						price: row.price,
						sort: row.sort,
						discount: row.discount,
						attributes: [],
					});
				}

				if (row.attributeId && row.attributeValue) {
					// Map slug to ID for consistency with productAttributes
					const attributeId = slugToIdMap[row.attributeId] || row.attributeId;
					variationsMap.get(row.id).attributes.push({
						attributeId: attributeId,
						value: row.attributeValue,
					});
				}
			}

			const variations = Array.from(variationsMap.values());

			// Process productAttributes - convert JSON string to array
			let productAttributesArray: { attributeId: string; value: string }[] = [];
			if (product.productAttributes) {
				try {
					const parsed = JSON.parse(product.productAttributes);
					// Convert object to array format expected by frontend
					if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
						// Fetch all available attributes to create dynamic mapping
						const allAttributes = await db.select().from(productAttributes);
						
						// Create mapping from attribute slugs to IDs
						const slugToIdMap: Record<string, string> = {};
						allAttributes.forEach(attr => {
							slugToIdMap[attr.slug] = attr.id.toString();
						});
						
						// Convert object to array of {attributeId, value} pairs
						productAttributesArray = Object.entries(parsed).map(([key, value]) => ({
							attributeId: slugToIdMap[key] || key, // Use mapped ID or fallback to key
							value: String(value)
						}));
					} else if (Array.isArray(parsed)) {
						productAttributesArray = parsed;
					}
				} catch (error) {
					console.error('Error parsing product attributes:', error);
					productAttributesArray = [];
				}
			}

			// Process store locations
			const storeLocationIds = storeLocationsResult.map(location => location.storeLocationId);

			const productWithDetails = {
				id: product.id,
				name: product.name,
				slug: product.slug,
				sku: product.sku,
				images: product.images,
				description: product.description,
				importantNote: product.importantNote,
				tags: product.tags,
				price: product.price,
				squareMetersPerPack: product.squareMetersPerPack,
				unitOfMeasurement: product.unitOfMeasurement,
				isActive: product.isActive,
				isFeatured: product.isFeatured,
				discount: product.discount,
				hasVariations: product.hasVariations,
				categorySlug: product.categorySlug,
				brandSlug: product.brandSlug,
				collectionSlug: product.collectionSlug,
				storeLocationId: product.storeLocationId,
				createdAt: product.createdAt,
				productAttributes: productAttributesArray,
				variations,
				storeLocationIds, // Add store location IDs for convenience
			};

			return productWithDetails;
		} catch (error) {
			console.error("Error fetching product:", error);
			setResponseStatus(500);
			throw new Error("Failed to fetch product");
		}
	});
