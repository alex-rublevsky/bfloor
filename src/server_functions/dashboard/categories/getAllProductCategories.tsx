import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { asc } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { DB } from "~/db";
import type * as schema from "~/schema";
import { categories } from "~/schema";

export const getAllProductCategories = createServerFn({
	method: "GET",
}).handler(async () => {
	try {
		const db: DrizzleD1Database<typeof schema> = DB();
		// Order by order field, then by name
		const categoriesResult = await db
			.select()
			.from(categories)
			.orderBy(asc(categories.order), asc(categories.name))
			.all();

		// Allow empty state: return [] when no categories yet

		return categoriesResult;
	} catch (error) {
		console.error("Error fetching dashboard categories data:", error);
		setResponseStatus(500);
		throw new Error("Failed to fetch dashboard categories data");
	}
});
