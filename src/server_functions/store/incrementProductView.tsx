/**
 * Increment Product View Count
 *
 * Tracks product popularity by incrementing view count atomically.
 * This is called when a product detail page is viewed.
 *
 * PERFORMANCE:
 * - Uses atomic SQL UPDATE with +1 increment (safe for concurrent requests)
 * - Non-blocking: Fire-and-forget pattern (doesn't wait for completion)
 * - Optimized for high-traffic scenarios
 */

import { createServerFn } from "@tanstack/react-start";
import { sql } from "drizzle-orm";
import { DB } from "~/db";
import { products } from "~/schema";

export const incrementProductView = createServerFn({ method: "POST" })
	.inputValidator((productId: number) => productId)
	.handler(async ({ data: productId }) => {
		try {
			const db = DB();

			// Atomic increment - safe for concurrent requests
			// Only increment for active products
			// viewCount defaults to 0, so no COALESCE needed (better index usage)
			await db
				.update(products)
				.set({
					viewCount: sql`${products.viewCount} + 1`,
				})
				.where(sql`${products.id} = ${productId} AND ${products.isActive} = 1`);

			// Return success (fire-and-forget pattern)
			return { success: true };
		} catch (error) {
			// Log error but don't throw - view tracking shouldn't break the app
			console.error("Failed to increment product view:", error);
			return { success: false, error: String(error) };
		}
	});
