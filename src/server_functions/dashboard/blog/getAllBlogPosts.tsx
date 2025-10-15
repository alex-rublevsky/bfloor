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

			// Get blog posts with their tea categories and product images (if linked) using the same approach as public API
			const blogResults = await db
				.select()
				.from(blogPosts)
				.leftJoin(
					blogTeaCategories,
					eq(blogTeaCategories.blogPostId, blogPosts.id),
				)
				.leftJoin(products, eq(products.slug, blogPosts.productSlug))
				.orderBy(desc(blogPosts.publishedAt));

			// Get all tea categories for the UI
			const allTeaCategories = await db.select().from(teaCategories).all();

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
							productName: linkedProduct?.name || null,
							images: finalImages,
							isVisible: post.isVisible,
							publishedAt: post.publishedAt
								? post.publishedAt.getTime()
								: Date.now(),
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

			// Convert Sets to arrays and get final posts
			const posts = Array.from(postsWithCategories.values()).map(
				({ post, categories }) => ({
					...post,
					teaCategories: Array.from(categories),
				}),
			);

			if (!posts || posts.length === 0) {
				setResponseStatus(404);
				throw new Error("No blog posts found");
			}

			return {
				posts,
				teaCategories: allTeaCategories,
			};
		} catch (error) {
			console.error("Error fetching blog data:", error);
			setResponseStatus(500);
			throw new Error("Failed to fetch blog data");
		}
	},
);
