import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { DB } from "~/db";
import type * as schema from "~/schema";
import { categories } from "~/schema";

export const deleteProductCategory = createServerFn({ method: "POST" })
	.inputValidator((data: { id: number }) => data)
	.handler(async ({ data }) => {
		try {
			const db: DrizzleD1Database<typeof schema> = DB();
			const id = data.id;

			if (Number.isNaN(id)) {
				setResponseStatus(400);
				throw new Error("Invalid category ID");
			}

			console.log("Deleting category with id:", id);

			// Check if category exists
			const existingCategory = await db
				.select()
				.from(categories)
				.where(eq(categories.id, id))
				.limit(1);

			if (existingCategory.length === 0) {
				setResponseStatus(404);
				throw new Error("Category not found");
			}

			// Delete the category
			await db.delete(categories).where(eq(categories.id, id));

			return {
				message: "Category deleted successfully",
			};
		} catch (error) {
			console.error("Error deleting category:", error);
			setResponseStatus(500);
			throw new Error("Failed to delete category");
		}
	});
