import { createServerFn } from "@tanstack/react-start";
import { count } from "drizzle-orm";
import { DB } from "~/db";
import { collections } from "~/schema";

/**
 * Efficiently gets total collections count using SQL COUNT
 * Optimized for Cloudflare D1:
 * - Uses Drizzle's count() aggregation function
 * - Single SQL query - much more efficient than fetching all collections
 */
export const getTotalCollectionsCount = createServerFn({ method: "GET" })
	.inputValidator(() => ({}))
	.handler(async (): Promise<number> => {
		const db = DB();

		const result = await db
			.select({ count: count(collections.id) })
			.from(collections)
			.limit(1)
			.all();

		return result[0]?.count ?? 0;
	});
