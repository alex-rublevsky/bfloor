import { createServerFn } from "@tanstack/react-start";
import { count } from "drizzle-orm";
import { DB } from "~/db";
import { orders } from "~/schema";

/**
 * Efficiently gets total orders count using SQL COUNT
 * Optimized for Cloudflare D1:
 * - Uses Drizzle's count() aggregation function
 * - Single SQL query - much more efficient than fetching all orders
 */
export const getTotalOrdersCount = createServerFn({ method: "GET" })
	.inputValidator(() => ({}))
	.handler(async (): Promise<number> => {
		const db = DB();

		const result = await db.select({ count: count(orders.id) }).from(orders);

		return result[0]?.count ?? 0;
	});
