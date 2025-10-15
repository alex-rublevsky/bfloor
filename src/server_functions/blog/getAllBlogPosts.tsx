import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { desc, eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { DB } from "~/db";
import type * as schema from "~/schema";
import {
	blogPosts,
	blogTeaCategories,
	products,
	teaCategories,
} from "~/schema";

export const getAllBlogPosts = createServerFn({ method: "GET" }).handler(
	async () => {
		try {
			const db: DrizzleD1Database<typeof schema> = DB();

			// Get blog posts with their tea categories and product images (if linked) using a cleaner approach
			// Only fetch visible blog posts for the public API
			const blogResults = await db
				.select()
				.from(blogPosts)
				.leftJoin(
					blogTeaCategories,
					eq(blogTeaCategories.blogPostId, blogPosts.id),
				)
				.leftJoin(products, eq(products.slug, blogPosts.productSlug))
				.where(eq(blogPosts.isVisible, true))
				.orderBy(desc(blogPosts.publishedAt));

			// Get all active tea categories separately for the filter
			const allTeaCategories = await db
				.select()
				.from(teaCategories)
				.where(eq(teaCategories.isActive, true));

			// Group blog results by post ID and collect tea categories
			const postsWithCategories = new Map();

			for (const row of blogResults) {
				const post = row.blog_posts;
				const teaCategory = row.blog_tea_categories;
				const linkedProduct = row.products;

				if (!postsWithCategories.has(post.id)) {
					// Determine which images to use: blog images or product images as fallback
					let finalImages = post.images;
					if (
						(!post.images || post.images.trim() === "") &&
						linkedProduct?.images
					) {
						finalImages = linkedProduct.images;
					}

					postsWithCategories.set(post.id, {
						post: {
							id: post.id,
							title: post.title,
							slug: post.slug,
							body: post.body,
							productSlug: post.productSlug,
							images: finalImages,
							publishedAt: post.publishedAt.getTime(),
							teaCategories: [],
						},
						categories: new Set(),
					});
				}

				if (teaCategory?.teaCategorySlug) {
					postsWithCategories
						.get(post.id)
						.categories.add(teaCategory.teaCategorySlug);
				}
			}

			// Convert Sets to arrays and get final posts with preview data only
			const posts = Array.from(postsWithCategories.values()).map(
				({ post, categories }) => {
					// Create excerpt from body (first 150 characters)
					const excerpt =
						post.body && post.body.length > 150
							? `${post.body.substring(0, 150).trim()}...`
							: post.body;

					return {
						id: post.id,
						title: post.title,
						slug: post.slug,
						excerpt, // Only excerpt, not full body
						images: post.images, // All images for proper gallery rendering
						publishedAt: post.publishedAt,
						teaCategories: Array.from(categories) as string[],
					};
				},
			);

			if (!posts || posts.length === 0) {
				setResponseStatus(404);
				throw new Error("No blog posts found");
			}

			return {
				posts,
				teaCategories: allTeaCategories,
				totalCount: posts.length,
			};
		} catch (error) {
			console.error("Error fetching blog data:", error);
			setResponseStatus(500);
			throw new Error("Failed to fetch blog data");
		}
	},
);
