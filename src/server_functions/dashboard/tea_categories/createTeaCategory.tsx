import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { DB } from "~/db";
import type * as schema from "~/schema";
import { teaCategories } from "~/schema";
import type { TeaCategoryFormData } from "~/types";

export const createTeaCategory = createServerFn({ method: "POST" })
	.inputValidator((data: TeaCategoryFormData) => data)
	.handler(async ({ data }) => {
		try {
			const db: DrizzleD1Database<typeof schema> = DB();
			const teaCategoryData = data;

			if (!teaCategoryData.name || !teaCategoryData.slug) {
				setResponseStatus(400);
				throw new Error("Missing required fields: name and slug are required");
			}

			const existingCategory = await db
				.select({ slug: teaCategories.slug })
				.from(teaCategories)
				.where(eq(teaCategories.slug, teaCategoryData.slug))
				.limit(1);

			if (existingCategory.length > 0) {
				setResponseStatus(409);
				throw new Error("A tea category with this slug already exists");
			}

			const insertResult = await db
				.insert(teaCategories)
				.values({
					name: teaCategoryData.name,
					slug: teaCategoryData.slug,
					description: teaCategoryData.description || null,
					blogSlug: teaCategoryData.blogSlug || null,
					isActive: teaCategoryData.isActive ?? true,
				})
				.returning();

			return {
				message: "Tea category created successfully",
				teaCategory: insertResult[0],
			};
		} catch (error) {
			console.error("Error creating tea category:", error);
			setResponseStatus(500);
			throw new Error("Failed to create tea category");
		}
	});
