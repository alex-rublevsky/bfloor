import { createServerFn } from "@tanstack/react-start";
import { count, sql } from "drizzle-orm";
import { DB } from "~/db";
import { products } from "~/schema";

export type CategoryCounts = Record<string, number>;

/**
 * Efficiently gets product counts per category using SQL COUNT
 * Optimized for Cloudflare D1:
 * - Uses Drizzle's count() aggregation function with GROUP BY
 * - Single SQL query that counts products per category
 * - Much more efficient than fetching all products
 * - Returns counts only for categories that have products
 *
 * Returns a map: categorySlug -> productCount
 */
export const getProductCategoryCounts = createServerFn({ method: "GET" })
	.inputValidator(() => ({}))
	.handler(async (): Promise<CategoryCounts> => {
		const db = DB();

		// Use Drizzle's count() aggregation function with GROUP BY
		// This leverages Drizzle's optimized COUNT operations
		const countsResult = await db
			.select({
				categorySlug: products.categorySlug,
				count: count(products.id),
			})
			.from(products)
			.where(sql`${products.categorySlug} IS NOT NULL`)
			.groupBy(products.categorySlug)
			.all();

		// Convert to simple object: categorySlug -> count
		const counts: CategoryCounts = {};
		countsResult.forEach((row) => {
			if (row.categorySlug) {
				counts[row.categorySlug] = row.count;
			}
		});

		return counts;
	});
