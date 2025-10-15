import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { DB } from "~/db";
import { blogPosts, blogTeaCategories, type schema } from "~/schema";

export const deleteBlogPost = createServerFn({ method: "POST" })
	.inputValidator((data: { id: number }) => data)
	.handler(async ({ data }) => {
		try {
			const db: DrizzleD1Database<typeof schema> = DB();
			const postId = data.id;

			if (Number.isNaN(postId)) {
				setResponseStatus(400);
				throw new Error("Invalid blog post ID");
			}

			console.log("Deleting blog post with ID:", postId);

			// Check if blog post exists (optimized to select only needed field)
			const existingPost = await db
				.select({ id: blogPosts.id })
				.from(blogPosts)
				.where(eq(blogPosts.id, postId))
				.limit(1);

			if (existingPost.length === 0) {
				setResponseStatus(404);
				throw new Error("Blog post not found");
			}

			// Delete tea category relationships first (cascade delete should handle this, but being explicit)
			await db
				.delete(blogTeaCategories)
				.where(eq(blogTeaCategories.blogPostId, postId));

			// Delete the blog post
			await db.delete(blogPosts).where(eq(blogPosts.id, postId));

			return {
				message: "Blog post deleted successfully",
				id: postId,
			};
		} catch (error) {
			console.error("Error deleting blog post:", error);
			setResponseStatus(500);
			throw new Error("Failed to delete blog post");
		}
	});
