/**
 * Test script to verify view tracking is working
 * Run with: npx tsx --env-file=.env test-view-tracking.ts
 */

import { DB } from "./src/db";
import { products } from "./src/schema";
import { sql, eq } from "drizzle-orm";

async function testViewTracking() {
	const db = DB();
	
	console.log("Testing view tracking...\n");
	
	// Check if view_count column exists
	try {
		const testQuery = await db.execute(
			sql`SELECT view_count FROM products LIMIT 1`
		);
		console.log("✅ view_count column exists");
	} catch (error: any) {
		if (error.message?.includes("no such column: view_count")) {
			console.log("❌ view_count column does NOT exist - migration not applied!");
			console.log("\nRun: pnpm drizzle-kit push");
			return;
		}
		throw error;
	}
	
	// Get a sample product
	const sampleProduct = await db
		.select({
			id: products.id,
			name: products.name,
			viewCount: products.viewCount,
		})
		.from(products)
		.where(eq(products.isActive, true))
		.limit(1);
	
	if (sampleProduct.length === 0) {
		console.log("❌ No active products found");
		return;
	}
	
	const product = sampleProduct[0];
	console.log(`\nTesting with product: ${product.name} (ID: ${product.id})`);
	console.log(`Current viewCount: ${product.viewCount ?? "NULL"}`);
	
	// Try to increment
	try {
		await db
			.update(products)
			.set({
				viewCount: sql`COALESCE(${products.viewCount}, 0) + 1`,
			})
			.where(eq(products.id, product.id));
		
		console.log("✅ Increment query executed");
		
		// Check new value
		const updated = await db
			.select({
				viewCount: products.viewCount,
			})
			.from(products)
			.where(eq(products.id, product.id))
			.limit(1);
		
		console.log(`New viewCount: ${updated[0]?.viewCount ?? "NULL"}`);
		
		if (updated[0]?.viewCount === (product.viewCount ?? 0) + 1) {
			console.log("✅ View count incremented successfully!");
		} else {
			console.log("❌ View count did not increment correctly");
		}
	} catch (error) {
		console.error("❌ Error incrementing view count:", error);
	}
	
	// Test sorting
	console.log("\n--- Testing sorting by viewCount ---");
	const sorted = await db
		.select({
			id: products.id,
			name: products.name,
			viewCount: products.viewCount,
		})
		.from(products)
		.where(eq(products.isActive, true))
		.orderBy(sql`COALESCE(${products.viewCount}, 0) DESC`)
		.limit(5);
	
	console.log("Top 5 products by viewCount:");
	sorted.forEach((p, i) => {
		console.log(`  ${i + 1}. ${p.name} - views: ${p.viewCount ?? "NULL"}`);
	});
}

testViewTracking().catch(console.error);
