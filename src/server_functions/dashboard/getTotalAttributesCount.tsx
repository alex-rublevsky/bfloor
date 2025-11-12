import { createServerFn } from "@tanstack/react-start";
import { count } from "drizzle-orm";
import { DB } from "~/db";
import { productAttributes } from "~/schema";

/**
 * Efficiently gets total attributes count using SQL COUNT
 * Optimized for Cloudflare D1:
 * - Uses Drizzle's count() aggregation function
 * - Single SQL query - much more efficient than fetching all attributes
 */
export const getTotalAttributesCount = createServerFn({ method: "GET" })
	.inputValidator(() => ({}))
	.handler(async (): Promise<number> => {
		const db = DB();

		const result = await db
			.select({ count: count(productAttributes.id) })
			.from(productAttributes)
			.limit(1)
			.all();

		return result[0]?.count ?? 0;
	});

