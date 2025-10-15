import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { and, eq } from "drizzle-orm";
import { DB } from "~/db";
import { blogPosts, blogTeaCategories, products } from "~/schema";

export const getBlogPostBySlug = createServerFn({ method: "GET" })
	.inputValidator((slug: string) => slug)
	.handler(async ({ data: slug }) => {
		if (!slug) {
			setResponseStatus(400);
			throw new Error("Slug parameter is required");
		}

		try {
			const db = DB();

			// Get the specific blog post with its tea categories and product images (if linked)
			// Only fetch visible blog posts for the public API
			const blogResults = await db
				.select()
				.from(blogPosts)
				.leftJoin(
					blogTeaCategories,
					eq(blogTeaCategories.blogPostId, blogPosts.id),
				)
				.leftJoin(products, eq(products.slug, blogPosts.productSlug))
				.where(and(eq(blogPosts.slug, slug), eq(blogPosts.isVisible, true)));

			if (!blogResults || blogResults.length === 0) {
				setResponseStatus(404);
				throw new Error("Blog post not found");
			}

			// Extract the blog post data and collect tea categories
			const post = blogResults[0].blog_posts;
			const linkedProduct = blogResults[0].products;
			const teaCategorySlugs: string[] = [];

			for (const row of blogResults) {
				if (row.blog_tea_categories?.teaCategorySlug) {
					teaCategorySlugs.push(row.blog_tea_categories.teaCategorySlug);
				}
			}

			// Determine which images to use: blog images or product images as fallback
			let finalImages = post.images;
			if (
				(!post.images || post.images.trim() === "") &&
				linkedProduct?.images
			) {
				finalImages = linkedProduct.images;
			}

			// Format the response
			const formattedPost = {
				id: post.id,
				title: post.title,
				slug: post.slug,
				body: post.body,
				productSlug: post.productSlug,
				images: finalImages,
				publishedAt: post.publishedAt.getTime(),
				teaCategories: teaCategorySlugs,
			};

			return formattedPost;
		} catch (error) {
			console.error("Error fetching blog post:", error);
			setResponseStatus(500);
			throw new Error("Failed to fetch blog post");
		}
	});
