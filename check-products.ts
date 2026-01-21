/**
 * Quick diagnostic script to check if products exist in database
 *
 * Run with environment variables:
 *   TURSO_DATABASE_URL=your_url TURSO_AUTH_TOKEN=your_token npx tsx check-products.ts
 *
 * Or source your .env file first:
 *   source .env && npx tsx check-products.ts
 *
 * Or use tsx with --env-file:
 *   npx tsx --env-file=.env check-products.ts
 */

import { count, sql } from "drizzle-orm";
import { DB } from "./src/db";
import { products } from "./src/schema";

async function checkProducts() {
	const db = DB();

	console.log("Checking products in database...\n");

	// Count all products
	const totalCount = await db
		.select({ count: count(products.id) })
		.from(products);

	console.log(`Total products: ${totalCount[0]?.count ?? 0}`);

	// Count active products
	const activeCount = await db
		.select({ count: count(products.id) })
		.from(products)
		.where(sql`${products.isActive} = 1`);

	console.log(`Active products: ${activeCount[0]?.count ?? 0}`);

	// Get a few sample products
	const samples = await db
		.select({
			id: products.id,
			name: products.name,
			slug: products.slug,
			isActive: products.isActive,
		})
		.from(products)
		.limit(5);

	console.log(`\nSample products (first 5):`);
	if (samples.length === 0) {
		console.log("  ❌ NO PRODUCTS FOUND - Database appears empty!");
	} else {
		samples.forEach((p) => {
			console.log(`  - ID: ${p.id}, Name: ${p.name}, Active: ${p.isActive}`);
		});
	}
}

checkProducts().catch(console.error);
