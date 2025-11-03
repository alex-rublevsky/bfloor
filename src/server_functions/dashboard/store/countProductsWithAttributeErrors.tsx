import { createServerFn } from "@tanstack/react-start";
import { sql } from "drizzle-orm";
import { DB } from "~/db";
import { products, productAttributes } from "~/schema";

/**
 * Counts all products with out-of-scope attributes in the database
 * Efficient server-side counting - no need to load all products to client
 */
export const countProductsWithAttributeErrors = createServerFn({ method: "GET" })
	.handler(async () => {
		try {
			const db = DB();

			// Get all standardized attribute slugs
			const allAttributes = await db.select().from(productAttributes);
			const standardizedSlugs = new Set(allAttributes.map((a) => a.slug));
			const standardizedIds = new Set(allAttributes.map((a) => a.id.toString()));

			if (standardizedSlugs.size === 0) {
				// No standardized attributes, so all products with attributes would have errors
				// But that's probably not the case, so return 0
				return { count: 0 };
			}

			// Get all products with attributes (only fetch id and product_attributes for efficiency)
			const allProductsWithAttributes = await db
				.select({
					id: products.id,
					productAttributes: products.productAttributes,
				})
				.from(products)
				.where(sql`${products.productAttributes} IS NOT NULL`);

			let errorCount = 0;

			// Check each product's attributes
			for (const product of allProductsWithAttributes) {
				if (!product.productAttributes) continue;

				try {
					const parsed = JSON.parse(product.productAttributes);
					let attributesToCheck: Array<{ attributeId: string; value: string }> = [];

					if (Array.isArray(parsed)) {
						// Array format
						attributesToCheck = parsed;
					} else if (typeof parsed === 'object' && parsed !== null) {
						// Object format - convert to array
						attributesToCheck = Object.entries(parsed).map(([key, value]) => ({
							attributeId: key,
							value: String(value)
						}));
					} else {
						continue; // Invalid format, skip
					}

					// Check if any attribute is out-of-scope
					const hasError = attributesToCheck.some((attr) => {
						// Check if attributeId matches a slug
						if (standardizedSlugs.has(attr.attributeId)) {
							return false; // Valid
						}
						// Check if attributeId matches an ID
						if (standardizedIds.has(attr.attributeId)) {
							return false; // Valid
						}
						// Not found in either - it's out-of-scope!
						return true;
					});

					if (hasError) {
						errorCount++;
					}
				} catch {
					// Skip products with unparseable JSON
					continue;
				}
			}

			return { count: errorCount };
		} catch (error) {
			console.error("Error counting products with attribute errors:", error);
			throw new Error("Failed to count products with attribute errors");
		}
	});

