import { createServerFn } from "@tanstack/react-start";
import { sql } from "drizzle-orm";
import { DB } from "~/db";
import { products, productAttributes } from "~/schema";

export type AttributeCounts = Record<number, number>;

/**
 * Efficiently gets product counts per attribute
 * Optimized for Cloudflare D1:
 * - Single query to get attributes (for mapping)
 * - Single query to get products with attributes (only necessary columns)
 * - In-memory counting (faster than complex SQL JSON parsing)
 * 
 * Returns a map: attributeId -> productCount
 */
export const getProductAttributeCounts = createServerFn({ method: "GET" })
	.inputValidator(() => ({}))
	.handler(async (): Promise<AttributeCounts> => {
		const db = DB();

		// Get all attributes for mapping
		const attributes = await db
			.select()
			.from(productAttributes);

		// Get all products that have attributes (only fetch necessary columns for efficiency)
		const productsWithAttributes = await db
			.select({
				id: products.id,
				productAttributes: products.productAttributes,
			})
			.from(products)
			.where(sql`${products.productAttributes} IS NOT NULL`);

		// Create unified lookup: attributeId (as string) or slug -> numeric ID
		const attributeLookup = new Map<string, number>();
		attributes.forEach((attr) => {
			attributeLookup.set(attr.id.toString(), attr.id);
			attributeLookup.set(attr.slug, attr.id);
		});

		// Count unique products per attribute (using Set to ensure each product is counted once)
		const attributeProductSets = new Map<number, Set<number>>();
		
		for (const product of productsWithAttributes) {
			if (!product.productAttributes) continue;
			
			try {
				const parsed = JSON.parse(product.productAttributes);
				
				// Normalize to array format
				const attrs = Array.isArray(parsed)
					? parsed
					: typeof parsed === 'object' && parsed !== null
						? Object.entries(parsed).map(([key, value]) => ({
							attributeId: key,
							value: String(value)
						}))
						: [];

				// Track unique attributes per product to avoid double-counting within same product
				const seenAttributes = new Set<number>();
				
				for (const attr of attrs) {
					const attributeId = attributeLookup.get(attr.attributeId);
					
					// Only count each attribute once per product (handles edge case of duplicate entries)
					if (attributeId && !seenAttributes.has(attributeId)) {
						seenAttributes.add(attributeId);
						
						const productSet = attributeProductSets.get(attributeId) ?? new Set<number>();
						productSet.add(product.id);
						attributeProductSets.set(attributeId, productSet);
					}
				}
			} catch {
				// Skip products with unparseable JSON
				continue;
			}
		}

		// Convert to simple object: attributeId -> count
		const counts: AttributeCounts = {};
		attributeProductSets.forEach((productSet, attributeId) => {
			counts[attributeId] = productSet.size;
		});

		return counts;
	});


