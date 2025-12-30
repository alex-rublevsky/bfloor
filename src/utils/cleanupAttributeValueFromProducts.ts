import { eq, sql } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type * as schema from "~/schema";
import { productAttributes, products } from "~/schema";

/**
 * Removes a specific attribute value from all products that have it selected
 * Handles comma-separated values in product_attributes JSON
 *
 * @param db - Database connection
 * @param attributeId - ID of the attribute (vid-profilya = 35)
 * @param valueToRemove - The value string to remove (e.g., "Профиль для лестницы")
 * @returns Number of products updated
 */
export async function cleanupAttributeValueFromProducts(
	db: LibSQLDatabase<typeof schema>,
	attributeId: number,
	valueToRemove: string,
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

			// Check if value to remove is in the list
			if (!values.includes(valueToRemove)) continue;

			// Remove the value
			const updatedValues = values.filter((v: string) => v !== valueToRemove);

			// Update or remove the attribute
			if (updatedValues.length === 0) {
				// Remove attribute entirely if no values left
				if (parsed[attributeSlug]) {
					delete parsed[attributeSlug];
				}
				if (parsed[attributeId.toString()]) {
					delete parsed[attributeId.toString()];
				}
			} else {
				// Update with remaining values (join if multiple, single if one)
				const newValue =
					updatedValues.length === 1
						? updatedValues[0]
						: updatedValues.join(",");

				// Use slug as key if it exists, otherwise use attributeId
				if (parsed[attributeSlug] !== undefined) {
					parsed[attributeSlug] = newValue;
				} else {
					parsed[attributeId.toString()] = newValue;
				}
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
