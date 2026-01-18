import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { DB } from "~/db";
import { brands } from "~/schema";

/**
 * Get brand by slug for store pages
 * Used for brand route validation and meta tags
 *
 * OPTIMIZED FOR SINGLE ENTITY LOOKUP:
 * - Uses .limit(1).all() and accesses [0] for correct data structure
 * - Proper error handling without setting response status
 * - Let TanStack Router handle 404s via notFound()
 */
export const getBrandBySlug = createServerFn({ method: "GET" })
	.inputValidator((slug: string) => slug)
	.handler(async ({ data: slug }) => {
		const db = DB();

		const result = await db
			.select()
			.from(brands)
			.where(eq(brands.slug, slug))
			.limit(1)
			.all();

		const brand = result[0];

		if (!brand) {
			throw new Error("Brand not found");
		}

		return brand;
	});
