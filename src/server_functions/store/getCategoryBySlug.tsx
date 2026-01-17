import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { DB } from "~/db";
import { categories } from "~/schema";

/**
 * Get category by slug for store pages
 * Used for category route validation and meta tags
 *
 * OPTIMIZED FOR SINGLE ENTITY LOOKUP:
 * - Uses .limit(1).all() and accesses [0] for correct data structure
 * - Proper error handling without setting response status
 * - Let TanStack Router handle 404s via notFound()
 *
 * Note: This is a single-entity lookup, so pagination/infinite fetching
 * doesn't apply. For collections of categories, use getAllProductCategories.
 */
export const getCategoryBySlug = createServerFn({ method: "GET" })
	.inputValidator((slug: string) => slug)
	.handler(async ({ data: slug }) => {
		const db = DB();

		const result = await db
			.select()
			.from(categories)
			.where(eq(categories.slug, slug))
			.limit(1)
			.all();

		const category = result[0];

		if (!category) {
			// Don't set response status - let TanStack Router handle 404s via notFound()
			// Setting status here causes platform-level NOT_FOUND errors
			throw new Error("Category not found");
		}

		return category;
	});
