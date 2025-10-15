import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { DB } from "~/db";
import type * as schema from "~/schema";
import { categories } from "~/schema";

export const getAllProductCategories = createServerFn({
	method: "GET",
}).handler(async () => {
	try {
		const db: DrizzleD1Database<typeof schema> = DB();
		const categoriesResult = await db.select().from(categories).all();

		if (!categoriesResult || categoriesResult.length === 0) {
			setResponseStatus(404);
			throw new Error("No categories found");
		}

		return categoriesResult;
	} catch (error) {
		console.error("Error fetching dashboard categories data:", error);
		setResponseStatus(500);
		throw new Error("Failed to fetch dashboard categories data");
	}
});
