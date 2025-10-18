import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { DB } from "~/db";
import type * as schema from "~/schema";
import { categories } from "~/schema";
import type { CategoryFormData } from "~/types";

export const createProductCategory = createServerFn({ method: "POST" })
	.inputValidator((data: CategoryFormData) => data)
	.handler(async ({ data }) => {
		try {
			const db: DrizzleD1Database<typeof schema> = DB();
			const categoryData = data;

			if (!categoryData.name || !categoryData.slug) {
				setResponseStatus(400);
				throw new Error("Missing required fields: name and slug are required");
			}

			// Check for duplicate slug
			const existingCategory = await db
				.select({ slug: categories.slug })
				.from(categories)
				.where(eq(categories.slug, categoryData.slug))
				.limit(1);

			if (existingCategory.length > 0) {
				setResponseStatus(409);
				throw new Error("A category with this slug already exists");
			}

			const insertResult = await db
				.insert(categories)
				.values({
					name: categoryData.name,
					slug: categoryData.slug,
					parentSlug: categoryData.parentSlug || null,
					image: categoryData.image || null,
					isActive: categoryData.isActive ?? true,
					order: categoryData.order ?? 0,
				})
				.returning();

			return {
				message: "Category created successfully",
				category: insertResult[0],
			};
		} catch (error) {
			console.error("Error creating category:", error);
			setResponseStatus(500);
			throw new Error("Failed to create category");
		}
	});
