import { createServerFn } from "@tanstack/react-start";
import { eq, inArray } from "drizzle-orm";
import { DB } from "~/db";
import {
	brands,
	categories,
	collections,
	countries,
	productAttributes,
	products,
	productStoreLocations,
	productVariations,
	storeLocations,
	variationAttributes,
} from "~/schema";

// Type for the complex query result
type QueryResult = {
	products: typeof products.$inferSelect;
	categories: typeof categories.$inferSelect | null;
	brands: typeof brands.$inferSelect | null;
	product_variations: typeof productVariations.$inferSelect | null;
	variation_attributes: typeof variationAttributes.$inferSelect | null;
};

export const getProductBySlug = createServerFn({ method: "GET" })
	.inputValidator((productId: string) => productId)
	.handler(async ({ data: productId }) => {
		const db = DB();

		const result = await db
			.select()
			.from(products)
			.where(eq(products.slug, productId))
			.leftJoin(categories, eq(products.categorySlug, categories.slug))
			.leftJoin(brands, eq(products.brandSlug, brands.slug))
			.leftJoin(productVariations, eq(productVariations.productId, products.id))
			.leftJoin(
				variationAttributes,
				eq(variationAttributes.productVariationId, productVariations.id),
			)
			.all();

		if (!result || result.length === 0) {
			// Don't set response status - let TanStack Router handle 404s via notFound()
			// Setting status here causes Vercel to return platform-level NOT_FOUND error
			throw new Error("Product not found");
		}

		const firstRow = result[0];
		const baseProduct = firstRow.products;

		// Fetch additional data in parallel
		const [storeLocationsData, collectionData, countryData] = await Promise.all(
			[
				// Fetch store locations for this product
				db
					.select()
					.from(productStoreLocations)
					.where(eq(productStoreLocations.productId, baseProduct.id))
					.all()
					.then(async (relations) => {
						if (relations.length === 0) return [];
						const locationIds = relations
							.map((r) => r.storeLocationId)
							.filter((id): id is number => id !== null);
						if (locationIds.length === 0) return [];
						return db
							.select()
							.from(storeLocations)
							.where(inArray(storeLocations.id, locationIds))
							.all()
							.catch(() => []);
					}),
				// Fetch collection if exists
				baseProduct.collectionSlug
					? db
							.select()
							.from(collections)
							.where(eq(collections.slug, baseProduct.collectionSlug))
							.limit(1)
							.then((rows) => rows[0] || null)
					: Promise.resolve(null),
				// Fetch country if brand has countryId
				firstRow.brands?.countryId
					? db
							.select()
							.from(countries)
							.where(eq(countries.id, firstRow.brands.countryId))
							.limit(1)
							.then((rows) => rows[0] || null)
					: Promise.resolve(null),
			],
		);

		const variationsMap = new Map();

		result.forEach((row: QueryResult) => {
			if (!row.product_variations) return;

			const variationId = row.product_variations.id;
			if (!variationsMap.has(variationId)) {
				variationsMap.set(variationId, {
					id: variationId,
					productId: row.product_variations.productId,
					sku: row.product_variations.sku,
					price: row.product_variations.price,
					sort: row.product_variations.sort || 0,
					discount: row.product_variations.discount,
					createdAt: row.product_variations.createdAt,
					attributes: [],
				});
			}

			if (row.variation_attributes) {
				variationsMap.get(variationId)?.attributes.push({
					id: row.variation_attributes.id,
					productVariationId: row.variation_attributes.productVariationId,
					attributeId: row.variation_attributes.attributeId,
					value: row.variation_attributes.value,
					createdAt: row.variation_attributes.createdAt,
				});
			}
		});

		// Fetch all attributes (cached by TanStack Query on client)
		const allAttributes = await db.select().from(productAttributes).all();
		const slugToIdMap: Record<string, string> = {};
		for (const attr of allAttributes) {
			slugToIdMap[attr.slug] = attr.id.toString();
		}

		// Map variation attributes from slugs to IDs
		for (const variation of variationsMap.values()) {
			if (variation.attributes && variation.attributes.length > 0) {
				variation.attributes = variation.attributes.map(
					(attr: { attributeId: string; value: string }) => ({
						...attr,
						attributeId: slugToIdMap[attr.attributeId] || attr.attributeId,
					}),
				);
			}
		}

		// Process images - parse JSON string or comma-separated string to array for frontend
		let imagesArray: string[] = [];
		if (baseProduct.images) {
			try {
				// First, try parsing as JSON array string
				imagesArray = JSON.parse(baseProduct.images) as string[];
			} catch {
				// If JSON parsing fails, try comma-separated string
				try {
					// Split by comma and trim whitespace
					imagesArray = baseProduct.images
						.split(",")
						.map((img) => img.trim())
						.filter(Boolean);
				} catch {
					// If both fail, return empty array
					console.error(
						"Failed to parse images for product:",
						baseProduct.slug,
					);
					imagesArray = [];
				}
			}
		}

		// Process productAttributes - convert JSON string to array
		let productAttributesArray: { attributeId: string; value: string }[] = [];
		if (baseProduct.productAttributes) {
			try {
				const parsed = JSON.parse(baseProduct.productAttributes);
				// Convert object to array format expected by frontend
				if (
					typeof parsed === "object" &&
					parsed !== null &&
					!Array.isArray(parsed)
				) {
					// Convert object to array of {attributeId, value} pairs
					productAttributesArray = Object.entries(parsed).map(
						([key, value]) => ({
							attributeId: key,
							value: String(value),
						}),
					);
				} else if (Array.isArray(parsed)) {
					productAttributesArray = parsed;
				}
			} catch {
				// If parsing fails, use empty array
				productAttributesArray = [];
			}
		}

		const productWithDetails = {
			...baseProduct,
			images: imagesArray, // Return as array - TanStack will serialize/deserialize automatically
			productAttributes: productAttributesArray,
			category: firstRow.categories
				? {
						name: firstRow.categories.name,
						slug: firstRow.categories.slug,
					}
				: null,
			brand: firstRow.brands
				? {
						name: firstRow.brands.name,
						slug: firstRow.brands.slug,
						image: firstRow.brands.image,
						country: countryData
							? {
									name: countryData.name,
									flagImage: countryData.flagImage,
								}
							: null,
					}
				: null,
			collection: collectionData
				? {
						name: collectionData.name,
						slug: collectionData.slug,
					}
				: null,
			storeLocations: storeLocationsData.map((loc) => ({
				id: loc.id,
				address: loc.address,
				description: loc.description,
				openingHours: loc.openingHours,
			})),
			variations: Array.from(variationsMap.values()),
		};

		return productWithDetails;
	});
