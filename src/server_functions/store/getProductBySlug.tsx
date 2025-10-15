import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { DB } from "~/db";
import {
	blogPosts,
	brands,
	categories,
	products,
	productTeaCategories,
	productVariations,
	teaCategories,
	variationAttributes,
} from "~/schema";
import type { ProductWithDetails } from "~/types";

// Type for the complex query result
type QueryResult = {
	products: typeof products.$inferSelect;
	categories: typeof categories.$inferSelect | null;
	brands: typeof brands.$inferSelect | null;
	blog_posts: typeof blogPosts.$inferSelect | null;
	product_variations: typeof productVariations.$inferSelect | null;
	variation_attributes: typeof variationAttributes.$inferSelect | null;
};

export const getProductBySlug = createServerFn({ method: "GET" })
	.inputValidator((productId: string) => productId)
	.handler(async ({ data: productId }) => {
		const db = DB();

		const result = await db
			.select()
			.from(products)
			.where(eq(products.slug, productId))
			.leftJoin(categories, eq(products.categorySlug, categories.slug))
			.leftJoin(brands, eq(products.brandSlug, brands.slug))
			.leftJoin(blogPosts, eq(blogPosts.productSlug, products.slug))
			.leftJoin(productVariations, eq(productVariations.productId, products.id))
			.leftJoin(
				variationAttributes,
				eq(variationAttributes.productVariationId, productVariations.id),
			)
			.all();

		if (!result || result.length === 0) {
			setResponseStatus(404);
			throw new Error("Product not found");
		}

		const firstRow = result[0];
		const baseProduct = firstRow.products;

		const teaCategoriesResult = baseProduct?.id
			? await db
					.select({
						slug: teaCategories.slug,
						name: teaCategories.name,
						description: teaCategories.description,
						blogSlug: teaCategories.blogSlug,
						isActive: teaCategories.isActive,
					})
					.from(productTeaCategories)
					.innerJoin(
						teaCategories,
						eq(productTeaCategories.teaCategorySlug, teaCategories.slug),
					)
					.where(eq(productTeaCategories.productId, baseProduct.id))
					.all()
			: [];

		const variationsMap = new Map();

		result.forEach((row: QueryResult) => {
			if (!row.product_variations) return;

			const variationId = row.product_variations.id;
			if (!variationsMap.has(variationId)) {
				variationsMap.set(variationId, {
					id: variationId,
					productId: row.product_variations.productId,
					sku: row.product_variations.sku,
					price: row.product_variations.price,
					stock: row.product_variations.stock,
					sort: row.product_variations.sort || 0,
					discount: row.product_variations.discount,
					shippingFrom: row.product_variations.shippingFrom,
					createdAt: row.product_variations.createdAt,
					attributes: [],
				});
			}

			if (row.variation_attributes) {
				variationsMap.get(variationId)?.attributes.push({
					id: row.variation_attributes.id,
					productVariationId: row.variation_attributes.productVariationId,
					attributeId: row.variation_attributes.attributeId,
					value: row.variation_attributes.value,
					createdAt: row.variation_attributes.createdAt,
				});
			}
		});

		const productWithDetails: ProductWithDetails = {
			...baseProduct,
			category: firstRow.categories
				? {
						name: firstRow.categories.name,
						slug: firstRow.categories.slug,
					}
				: null,
			brand: firstRow.brands
				? {
						name: firstRow.brands.name,
						slug: firstRow.brands.slug,
					}
				: null,
			blogPost: firstRow.blog_posts
				? {
						id: firstRow.blog_posts.id,
						title: firstRow.blog_posts.title || "",
						slug: firstRow.blog_posts.slug,
						body: firstRow.blog_posts.body || "",
						blogUrl: `/blog/${firstRow.blog_posts.slug}`,
					}
				: null,
			description: firstRow.blog_posts?.body || baseProduct.description,
			variations: Array.from(variationsMap.values()),
			teaCategories: teaCategoriesResult.map((tc) => {
				const mapped = {
					slug: tc.slug,
					name: tc.name,
					description: tc.description,
					blogSlug: tc.blogSlug,
					isActive: tc.isActive ?? true,
				};
				return mapped;
			}),
		};

		return productWithDetails;
	});
