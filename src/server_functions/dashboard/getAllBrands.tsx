import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { DB } from "~/db";
import type * as schema from "~/schema";
import { brands } from "~/schema";

export const getAllBrands = createServerFn({ method: "GET" }).handler(
	async () => {
		try {
			const db: DrizzleD1Database<typeof schema> = DB();
			const brandsResult = await db.select().from(brands).all();

			// Return empty array if no brands found instead of throwing error
			return brandsResult || [];
		} catch (error) {
			console.error("Error fetching dashboard brands data:", error);
			setResponseStatus(500);
			throw new Error("Failed to fetch dashboard brands data");
		}
	},
);
