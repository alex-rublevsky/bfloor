import { createServerFn } from "@tanstack/react-start";
import { count } from "drizzle-orm";
import { DB } from "~/db";
import { storeLocations } from "~/schema";

/**
 * Efficiently gets total store locations count using SQL COUNT
 * Optimized for Cloudflare D1:
 * - Uses Drizzle's count() aggregation function
 * - Single SQL query - much more efficient than fetching all store locations
 */
export const getTotalStoreLocationsCount = createServerFn({ method: "GET" })
	.inputValidator(() => ({}))
	.handler(async (): Promise<number> => {
		const db = DB();

		const result = await db
			.select({ count: count(storeLocations.id) })
			.from(storeLocations)
			.limit(1)
			.all();

		return result[0]?.count ?? 0;
	});
