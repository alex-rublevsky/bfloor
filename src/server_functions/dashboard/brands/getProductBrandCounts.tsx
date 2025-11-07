import { createServerFn } from "@tanstack/react-start";
import { count, sql } from "drizzle-orm";
import { DB } from "~/db";
import { products } from "~/schema";

export type BrandCounts = Record<string, number>;

/**
 * Efficiently gets product counts per brand using SQL COUNT
 * Optimized for Cloudflare D1:
 * - Uses Drizzle's count() aggregation function with GROUP BY
 * - Single SQL query that counts products per brand
 * - Much more efficient than fetching all products
 * - Returns counts only for brands that have products
 *
 * Returns a map: brandSlug -> productCount
 */
export const getProductBrandCounts = createServerFn({ method: "GET" })
	.inputValidator(() => ({}))
	.handler(async (): Promise<BrandCounts> => {
		const db = DB();

		// Use Drizzle's count() aggregation function with GROUP BY
		// This leverages Drizzle's optimized COUNT operations
		const countsResult = await db
			.select({
				brandSlug: products.brandSlug,
				count: count(products.id),
			})
			.from(products)
			.where(sql`${products.brandSlug} IS NOT NULL`)
			.groupBy(products.brandSlug)
			.all();

		// Convert to simple object: brandSlug -> count
		const counts: BrandCounts = {};
		countsResult.forEach((row) => {
			if (row.brandSlug) {
				counts[row.brandSlug] = row.count;
			}
		});

		return counts;
	});
