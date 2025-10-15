import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { DB } from "~/db";
import { blogPosts, blogTeaCategories, type schema } from "~/schema";
import type { BlogPostFormData } from "~/types";

export const createBlogPost = createServerFn({ method: "POST" })
	.inputValidator((data: BlogPostFormData) => data)
	.handler(async ({ data }) => {
		try {
			const db: DrizzleD1Database<typeof schema> = DB();
			const blogData = data;

			if (!blogData.slug || !blogData.body) {
				setResponseStatus(400);
				throw new Error("Missing required fields: slug and body are required");
			}

			// Check for duplicate slug (optimized to select only needed fields)
			const existingPost = await db
				.select({ id: blogPosts.id })
				.from(blogPosts)
				.where(eq(blogPosts.slug, blogData.slug))
				.limit(1);

			if (existingPost.length > 0) {
				setResponseStatus(409);
				throw new Error("A blog post with this slug already exists");
			}

			// Insert the blog post
			const insertResult = await db
				.insert(blogPosts)
				.values({
					title: blogData.title,
					slug: blogData.slug,
					body: blogData.body,
					productSlug: blogData.productSlug || null,
					images: blogData.images || null,
					isVisible: blogData.isVisible ?? true,
					publishedAt: new Date(blogData.publishedAt),
				})
				.returning({ id: blogPosts.id });

			const newPostId = insertResult[0].id;

			// Insert tea category relationships if provided
			if (blogData.teaCategories && blogData.teaCategories.length > 0) {
				const categoryInserts = blogData.teaCategories.map((categorySlug) => ({
					blogPostId: newPostId,
					teaCategorySlug: categorySlug,
				}));

				await db.insert(blogTeaCategories).values(categoryInserts);
			}

			return {
				message: "Blog post created successfully",
				id: newPostId,
			};
		} catch (error) {
			console.error("Error creating blog post:", error);
			setResponseStatus(500);
			throw new Error("Failed to create blog post");
		}
	});
