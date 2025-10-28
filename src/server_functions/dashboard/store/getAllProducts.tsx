import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { DB } from "~/db";
import type * as schema from "~/schema";
import {
	products,
	productVariations,
	variationAttributes,
} from "~/schema";
import type {
	ProductVariationWithAttributes,
	ProductWithVariations,
} from "~/types";

// Type for the joined query result
type JoinedQueryResult = {
	products: typeof products.$inferSelect;
	product_variations: typeof productVariations.$inferSelect | null;
	variation_attributes: typeof variationAttributes.$inferSelect | null;
};

export const getAllProducts = createServerFn({ method: "GET" })
	.inputValidator((data: { page?: number; limit?: number } = {}) => data)
	.handler(async ({ data = {} }) => {
		try {
			const db: DrizzleD1Database<typeof schema> = DB();
			const { page, limit: pageLimit } = data;

		// Calculate pagination if provided
		const hasPagination = typeof page === 'number' && typeof pageLimit === 'number';
		const offsetValue = hasPagination ? (page - 1) * pageLimit : 0;

		// Get total count for pagination info
			const totalCountResult = await db
				.select({ count: products.id })
				.from(products)
				.all();
			const totalCount = totalCountResult.length;

			// Build the products query with conditional pagination
			const baseQuery = db
				.select()
				.from(products)
				.leftJoin(
					productVariations,
					eq(productVariations.productId, products.id),
				)
				.leftJoin(
					variationAttributes,
					eq(variationAttributes.productVariationId, productVariations.id),
				);

			// Apply pagination if provided
			const rows: JoinedQueryResult[] = hasPagination
				? await baseQuery.limit(pageLimit).offset(offsetValue).all()
				: await baseQuery.all();

			// Allow empty state: don't error when there are no products yet

			// Group products and build variations
			const productMap = new Map<number, ProductWithVariations>();
			const variationMap = new Map<number, ProductVariationWithAttributes>();

			for (const row of rows || []) {
				const product = row.products;
				const variation = row.product_variations;
				const attribute = row.variation_attributes;

				// Initialize product if not exists
				if (!productMap.has(product.id)) {
					// Process images - convert JSON array to comma-separated string
					let imagesString = "";
					if (product.images) {
						try {
							const imagesArray = JSON.parse(product.images) as string[];
							imagesString = imagesArray.join(", ");
						} catch {
							// If it's already a comma-separated string, use it as-is
							imagesString = product.images;
						}
					}

					// Process productAttributes - convert JSON string to array
					let productAttributesArray: { attributeId: string; value: string }[] = [];
					if (product.productAttributes) {
						try {
							const parsed = JSON.parse(product.productAttributes);
							// Convert object to array format expected by frontend
							if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
								// Convert object to array of {attributeId, value} pairs
								productAttributesArray = Object.entries(parsed).map(([key, value]) => ({
									attributeId: key,
									value: String(value)
								}));
							} else if (Array.isArray(parsed)) {
								productAttributesArray = parsed;
							}
						} catch {
							// If parsing fails, use empty array
							productAttributesArray = [];
						}
					}

					// Process tags - convert JSON string to array
					let tagsArray: string[] = [];
					if (product.tags) {
						try {
							const parsed = JSON.parse(product.tags);
							if (Array.isArray(parsed)) {
								tagsArray = parsed;
							}
						} catch {
							// If parsing fails, use empty array
							tagsArray = [];
						}
					}

					productMap.set(product.id, {
						...product,
						images: imagesString,
						productAttributes: JSON.stringify(productAttributesArray),
						tags: JSON.stringify(tagsArray),
						variations: [],
					});
				}

				const currentProduct = productMap.get(product.id);
				if (!currentProduct) {
					continue; // Skip if product not found in map
				}

				// Process variations if product has them
				if (variation) {
					// Initialize variation if not exists
					if (!variationMap.has(variation.id)) {
						variationMap.set(variation.id, {
							id: variation.id,
							productId: variation.productId,
							sku: variation.sku,
							price: variation.price,
							sort: variation.sort,
							discount: variation.discount,
							createdAt: variation.createdAt,
							attributes: [],
						});
					}

					// Add attribute to variation if exists
					if (attribute) {
						const currentVariation = variationMap.get(variation.id);
						if (!currentVariation) continue;
						const existingAttribute = currentVariation.attributes.find(
							(attr) => attr.attributeId === attribute.attributeId,
						);

						if (!existingAttribute) {
							currentVariation.attributes.push({
								attributeId: attribute.attributeId,
								value: attribute.value,
							});
						}
					}
				}
			}

			// Assign variations to products
			for (const variation of variationMap.values()) {
				const productId = rows.find(
					(row) => row.product_variations?.id === variation.id,
				)?.products.id;
				if (productId) {
					const product = productMap.get(productId);
					if (
						product &&
						!product.variations?.find((v) => v.id === variation.id)
					) {
						product.variations?.push(variation);
					}
				}
			}

			// Sort variations by sort field
			for (const product of productMap.values()) {
				product.variations?.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
			}

		// Convert to array and sort alphabetically
		const productsArray = Array.from(productMap.values()).sort((a, b) =>
			a.name.localeCompare(b.name)
		);

		const result = {
			products: productsArray,
		};

			// Add pagination info if pagination was used
			if (hasPagination && page !== undefined && pageLimit !== undefined) {
				const hasNextPage = offsetValue + pageLimit < totalCount;
				const hasPreviousPage = page > 1;
				
				return {
					...result,
					pagination: {
						page,
						limit: pageLimit,
						totalCount,
						totalPages: Math.ceil(totalCount / pageLimit),
						hasNextPage,
						hasPreviousPage,
					},
				};
			}

			return {
				...result,
				pagination: {
					page: 1,
					limit: totalCount,
					totalCount,
					totalPages: 1,
					hasNextPage: false,
					hasPreviousPage: false,
				},
			};
		} catch (error) {
			console.error("Error fetching dashboard data:", error);
			console.error(
				"Error stack:",
				error instanceof Error ? error.stack : "No stack trace",
			);
			console.error("Error details:", {
				message: error instanceof Error ? error.message : String(error),
				name: error instanceof Error ? error.name : "Unknown",
			});
			setResponseStatus(500);
			throw new Error(`Failed to fetch dashboard data: ${error instanceof Error ? error.message : String(error)}`);
		}
	});
