import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { DB } from "~/db";
import type * as schema from "~/schema";
import { brands, products } from "~/schema";

export const deleteBrand = createServerFn({ method: "POST" })
	.inputValidator((data: { id: number }) => data)
	.handler(async ({ data }) => {
		try {
			const db: DrizzleD1Database<typeof schema> = DB();
			const { id } = data;

			// Check if brand exists
			const existingBrand = await db
				.select({ id: brands.id, slug: brands.slug })
				.from(brands)
				.where(eq(brands.id, id))
				.limit(1);

			if (existingBrand.length === 0) {
				setResponseStatus(404);
				throw new Error("Brand not found");
			}

			// Check if any products are using this brand
			const productsUsingBrand = await db
				.select({ id: products.id })
				.from(products)
				.where(eq(products.brandSlug, existingBrand[0].slug))
				.limit(1);

			if (productsUsingBrand.length > 0) {
				setResponseStatus(409);
				throw new Error(
					"Cannot delete brand: there are products using this brand",
				);
			}

			// Delete the brand
			const deleteResult = await db
				.delete(brands)
				.where(eq(brands.id, id))
				.returning();

			if (deleteResult.length === 0) {
				setResponseStatus(404);
				throw new Error("Brand not found");
			}

			return {
				message: "Brand deleted successfully",
			};
		} catch (error) {
			console.error("Error deleting brand:", error);
			setResponseStatus(500);
			throw new Error("Failed to delete brand");
		}
	});
