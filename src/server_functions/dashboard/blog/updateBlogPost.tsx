import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { DB } from "~/db";
import type * as schema from "~/schema";
import { blogPosts, blogTeaCategories } from "~/schema";
import type { BlogPostFormData } from "~/types";

export const updateBlogPost = createServerFn({ method: "POST" })
	.inputValidator((data: { id: number; data: BlogPostFormData }) => data)
	.handler(async ({ data }) => {
		try {
			const db: DrizzleD1Database<typeof schema> = DB();
			const { id, data: blogData } = data;

			if (!blogData.slug || !blogData.body) {
				setResponseStatus(400);
				throw new Error("Missing required fields: slug and body are required");
			}

			// Check if blog post exists
			const existingPost = await db
				.select({ id: blogPosts.id })
				.from(blogPosts)
				.where(eq(blogPosts.id, id))
				.limit(1);

			if (existingPost.length === 0) {
				setResponseStatus(404);
				throw new Error("Blog post not found");
			}

			// Check for duplicate slug (excluding current post)
			const duplicatePost = await db
				.select({ id: blogPosts.id })
				.from(blogPosts)
				.where(eq(blogPosts.slug, blogData.slug))
				.limit(1);

			if (duplicatePost.length > 0 && duplicatePost[0].id !== id) {
				setResponseStatus(409);
				throw new Error("A blog post with this slug already exists");
			}

			// Update the blog post
			await db
				.update(blogPosts)
				.set({
					title: blogData.title,
					slug: blogData.slug,
					body: blogData.body,
					productSlug: blogData.productSlug || null,
					images: blogData.images || null,
					isVisible: blogData.isVisible ?? true,
					publishedAt: new Date(blogData.publishedAt),
				})
				.where(eq(blogPosts.id, id));

			// Delete existing tea category relationships
			await db
				.delete(blogTeaCategories)
				.where(eq(blogTeaCategories.blogPostId, id));

			// Insert new tea category relationships if provided
			if (blogData.teaCategories && blogData.teaCategories.length > 0) {
				const categoryInserts = blogData.teaCategories.map((categorySlug) => ({
					blogPostId: id,
					teaCategorySlug: categorySlug,
				}));

				await db.insert(blogTeaCategories).values(categoryInserts);
			}

			return {
				message: "Blog post updated successfully",
				id,
			};
		} catch (error) {
			console.error("Error updating blog post:", error);
			setResponseStatus(500);
			throw new Error("Failed to update blog post");
		}
	});
