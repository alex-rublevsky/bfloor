import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { DB } from "~/db";
import type * as schema from "~/schema";
import { teaCategories } from "~/schema";

export const getAllTeaCategories = createServerFn({ method: "GET" }).handler(
	async () => {
		try {
			const db: DrizzleD1Database<typeof schema> = DB();
			const teaCategoriesResult = await db.select().from(teaCategories).all();

			if (!teaCategoriesResult || teaCategoriesResult.length === 0) {
				setResponseStatus(404);
				throw new Error("No tea categories found");
			}

			return teaCategoriesResult;
		} catch (error) {
			console.error("Error fetching dashboard tea categories data:", error);
			setResponseStatus(500);
			throw new Error("Failed to fetch dashboard tea categories data");
		}
	},
);
