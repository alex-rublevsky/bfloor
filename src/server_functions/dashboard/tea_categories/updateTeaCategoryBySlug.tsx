import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { DB } from "~/db";
import type * as schema from "~/schema";
import { teaCategories } from "~/schema";
import type { TeaCategoryFormData } from "~/types";

export const updateTeaCategoryBySlug = createServerFn({ method: "POST" })
	.inputValidator((data: { slug: string; data: TeaCategoryFormData }) => data)
	.handler(async ({ data }) => {
		try {
			const db = DB() as DrizzleD1Database<typeof schema>;
			const { slug, data: teaCategoryData } = data;

			if (!teaCategoryData.name || !teaCategoryData.slug) {
				setResponseStatus(400);
				throw new Error("Missing required fields: name and slug are required");
			}

			// Check if category exists
			const existingCategory = await db
				.select()
				.from(teaCategories)
				.where(eq(teaCategories.slug, slug))
				.limit(1);

			if (existingCategory.length === 0) {
				setResponseStatus(404);
				throw new Error("Tea category not found");
			}

			// If slug is being changed, check for duplicate
			if (slug !== teaCategoryData.slug) {
				const duplicateCheck = await db
					.select({ slug: teaCategories.slug })
					.from(teaCategories)
					.where(eq(teaCategories.slug, teaCategoryData.slug))
					.limit(1);

				if (duplicateCheck.length > 0) {
					setResponseStatus(409);
					throw new Error("A tea category with this slug already exists");
				}
			}

			// Update the tea category
			const updateResult = await db
				.update(teaCategories)
				.set({
					name: teaCategoryData.name,
					slug: teaCategoryData.slug,
					description: teaCategoryData.description || null,
					blogSlug: teaCategoryData.blogSlug || null,
					isActive: teaCategoryData.isActive ?? true,
				})
				.where(eq(teaCategories.slug, slug))
				.returning();

			return {
				message: "Tea category updated successfully",
				teaCategory: updateResult[0],
			};
		} catch (error) {
			console.error("Error updating tea category:", error);
			setResponseStatus(500);
			throw new Error("Failed to update tea category");
		}
	});
