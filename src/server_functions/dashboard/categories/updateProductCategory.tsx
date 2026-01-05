import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { DB } from "~/db";
import { categories } from "~/schema";
import type { CategoryFormData } from "~/types";
import { moveSingleStagingImage } from "../store/moveStagingImages";

export const updateProductCategory = createServerFn({ method: "POST" })
	.inputValidator((data: { id: number; data: CategoryFormData }) => data)
	.handler(async ({ data }) => {
		try {
			const db = DB();
			const { id, data: categoryData } = data;

			if (Number.isNaN(id)) {
				setResponseStatus(400);
				throw new Error("Invalid category ID");
			}

			if (!categoryData.name || !categoryData.slug) {
				setResponseStatus(400);
				throw new Error("Missing required fields: name and slug are required");
			}

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

			// If slug is being changed, check for duplicate
			if (existingCategory[0].slug !== categoryData.slug) {
				const duplicateCheck = await db
					.select({ slug: categories.slug })
					.from(categories)
					.where(eq(categories.slug, categoryData.slug))
					.limit(1);

				if (duplicateCheck.length > 0) {
					setResponseStatus(409);
					throw new Error("A category with this slug already exists");
				}
			}

			// Move staging images to final location before saving
			const finalImage = await moveSingleStagingImage(
				categoryData.image,
				{
					finalFolder: "categories",
					slug: categoryData.slug,
					productName: categoryData.name,
				},
			);

			// Update the category
			const updateResult = await db
				.update(categories)
				.set({
					name: categoryData.name,
					slug: categoryData.slug,
					parentSlug: categoryData.parentSlug || null,
					image: finalImage || null,
					isActive: categoryData.isActive ?? true,
					order: categoryData.order ?? 0,
				})
				.where(eq(categories.id, id))
				.returning();

			return {
				message: "Category updated successfully",
				category: updateResult[0],
			};
		} catch (error) {
			console.error("Error updating category:", error);
			setResponseStatus(500);
			throw new Error("Failed to update category");
		}
	});
