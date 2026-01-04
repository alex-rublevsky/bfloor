import { createServerFn } from "@tanstack/react-start";
import { staticFunctionMiddleware } from "@tanstack/start-static-server-functions";
import { count } from "drizzle-orm";
import { DB } from "~/db";
import { products } from "~/schema";

/**
 * Efficiently gets total products count using SQL COUNT
 * Optimized for Cloudflare D1:
 * - Uses Drizzle's count() aggregation function
 * - Single SQL query - much more efficient than fetching all products
 * - Evaluated once at build time using staticFunctionMiddleware
 */
export const getTotalProductsCount = createServerFn({ method: "GET" })
	.middleware([staticFunctionMiddleware])
	.handler(async (): Promise<number> => {
		const db = DB();

		const result = await db
			.select({ count: count(products.id) })
			.from(products)
			.limit(1)
			.all();

		return result[0]?.count ?? 0;
	});
