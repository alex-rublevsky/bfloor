import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { DB } from "~/db";
import type * as schema from "~/schema";
import { products } from "~/schema";
import { authMiddleware } from "~/utils/auth-middleware";

type User = {
	id?: string;
	name?: string;
	email?: string;
	image?: string | null;
} | null;

type AuthContext = {
	user: User;
};

/**
 * Lightweight server function to fetch products for the ProductSelector component
 * Returns only the essential fields needed for the dropdown
 */
export const getProductsForSelector = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.handler(async ({ context }: { context: AuthContext }) => {
		// Check if user is authenticated (basic check, admin check happens at route level)
		if (!context?.user?.id) {
			setResponseStatus(401);
			throw new Error("Unauthorized");
		}

		try {
			const db: DrizzleD1Database<typeof schema> = DB();

			// Fetch only the fields we need for the selector
			const productsResult = await db
				.select({
					id: products.id,
					name: products.name,
					slug: products.slug,
					images: products.images,
				})
				.from(products)
				.orderBy(products.name);

			return {
				products: productsResult,
			};
		} catch (error) {
			console.error("Error fetching products for selector:", error);
			setResponseStatus(500);
			throw new Error("Failed to fetch products");
		}
	});
