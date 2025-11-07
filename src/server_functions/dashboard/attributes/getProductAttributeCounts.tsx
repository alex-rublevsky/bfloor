import { env } from "cloudflare:workers";
import { createServerFn } from "@tanstack/react-start";
import { DB } from "~/db";
import { productAttributes } from "~/schema";

export type AttributeCounts = Record<number, number>;

/**
 * Efficiently gets product counts per attribute using SQL COUNT with JSON functions
 * Optimized for Cloudflare D1:
 * - Uses SQLite's json_each() to expand JSON in the database (requires raw SQL)
 * - Single SQL query with COUNT(DISTINCT) and GROUP BY
 * - Much more efficient than fetching all products and parsing in memory
 * - Handles both array format [{"attributeId": "1", "value": "red"}]
 *   and object format {"color": "red"} (where keys are slugs)
 *
 * Note: Uses raw SQL because Drizzle doesn't support json_each() in query builder
 *
 * Returns a map: attributeId -> productCount
 */
export const getProductAttributeCounts = createServerFn({ method: "GET" })
	.inputValidator(() => ({}))
	.handler(async (): Promise<AttributeCounts> => {
		const db = DB();

		// Get all attributes for slug-to-ID mapping (needed for object format)
		const attributes = await db.select().from(productAttributes);
		const slugToIdMap = new Map<string, number>();
		attributes.forEach((attr) => {
			slugToIdMap.set(attr.slug, attr.id);
			slugToIdMap.set(attr.id.toString(), attr.id); // Also map ID strings
		});

		// Use SQL COUNT with json_each to count products per attribute
		// Note: json_each() requires raw SQL as Drizzle doesn't support it in query builder
		// This is the most efficient approach for JSON operations in SQLite/D1
		const rawQuery = `
			WITH expanded_attributes AS (
				SELECT 
					p.id as product_id,
					CASE 
						WHEN json_type(p.product_attributes) = 'array' THEN
							json_extract(value.value, '$.attributeId')
						WHEN json_type(p.product_attributes) = 'object' THEN
							value.key
						ELSE NULL
					END as attribute_identifier
				FROM products p
				CROSS JOIN json_each(p.product_attributes) as value
				WHERE p.product_attributes IS NOT NULL
			)
			SELECT 
				attribute_identifier,
				COUNT(DISTINCT product_id) as count
			FROM expanded_attributes
			WHERE attribute_identifier IS NOT NULL
			GROUP BY attribute_identifier
		`;

		// Use D1 database directly for raw SQL (required for json_each)
		const result = await env.DB.prepare(rawQuery).all<{
			attribute_identifier: string;
			count: number;
		}>();

		// Convert SQL result to our format: attributeId -> count
		// Need to map slugs to IDs for object format
		const counts: AttributeCounts = {};

		if (result.results) {
			for (const row of result.results) {
				const identifier = String(row.attribute_identifier || "");
				const count = Number(row.count || 0);
				const attributeId = slugToIdMap.get(identifier);

				if (attributeId && count > 0) {
					// If we already have a count for this attribute, take the maximum
					// (shouldn't happen, but defensive)
					counts[attributeId] = Math.max(counts[attributeId] || 0, count);
				}
			}
		}

		return counts;
	});
