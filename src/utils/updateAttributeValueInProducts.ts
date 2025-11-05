import { eq, sql } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type * as schema from "~/schema";
import { productAttributes, products } from "~/schema";

/**
 * Updates a specific attribute value in all products that have it selected
 * Handles comma-separated values in product_attributes JSON
 * Useful when renaming an attribute value
 * @param db - Database connection
 * @param attributeId - ID of the attribute (vid-profilya = 35)
 * @param oldValue - The old value string to replace (e.g., "Профиль для лестницы")
 * @param newValue - The new value string (e.g., "Профиль лестничный")
 * @returns Number of products updated
 */
export async function updateAttributeValueInProducts(
	db: DrizzleD1Database<typeof schema>,
	attributeId: number,
	oldValue: string,
	newValue: string,
): Promise<{ updatedCount: number; productIds: number[] }> {
	// Get the attribute slug to find it in product_attributes JSON
	const attribute = await db
		.select()
		.from(productAttributes)
		.where(eq(productAttributes.id, attributeId))
		.limit(1);

	if (attribute.length === 0) {
		return { updatedCount: 0, productIds: [] };
	}

	const attributeSlug = attribute[0].slug;

	// Get all products with this attribute
	const allProducts = await db
		.select({
			id: products.id,
			productAttributes: products.productAttributes,
		})
		.from(products)
		.where(sql`${products.productAttributes} IS NOT NULL`);

	const updatedProductIds: number[] = [];
	let updateCount = 0;

	for (const product of allProducts) {
		if (!product.productAttributes) continue;

		try {
			const parsed = JSON.parse(product.productAttributes);

			// Check if product has this attribute
			const currentValue =
				parsed[attributeSlug] || parsed[attributeId.toString()];
			if (!currentValue) continue;

			// Handle both single value and comma-separated values
			const values =
				typeof currentValue === "string"
					? currentValue
							.split(",")
							.map((v: string) => v.trim())
							.filter(Boolean)
					: [String(currentValue)];

			// Check if old value is in the list
			if (!values.includes(oldValue)) continue;

			// Replace old value with new value
			const updatedValues = values.map((v: string) =>
				v === oldValue ? newValue : v,
			);

			// Update the attribute value
			const newValueString =
				updatedValues.length === 1 ? updatedValues[0] : updatedValues.join(",");

			// Use slug as key if it exists, otherwise use attributeId
			if (parsed[attributeSlug] !== undefined) {
				parsed[attributeSlug] = newValueString;
			} else {
				parsed[attributeId.toString()] = newValueString;
			}

			// Update the product
			await db
				.update(products)
				.set({
					productAttributes: JSON.stringify(parsed),
				})
				.where(eq(products.id, product.id));

			updatedProductIds.push(product.id);
			updateCount++;
		} catch (error) {
			// Skip products with invalid JSON
			console.warn(
				`Failed to parse attributes for product ${product.id}:`,
				error,
			);
		}
	}

	return { updatedCount: updateCount, productIds: updatedProductIds };
}
