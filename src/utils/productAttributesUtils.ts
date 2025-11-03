import type { ProductAttribute } from "~/types";

/**
 * Utility function to check if a product has out-of-scope attributes
 * This is the same logic used in AdminProductCard for consistency
 */
export function hasOutOfScopeAttributes(
	productAttributes: string | null | undefined,
	availableAttributes: ProductAttribute[] | undefined
): boolean {
	if (!productAttributes || !availableAttributes?.length) {
		return false;
	}

	try {
		let attributesToCheck: Array<{ attributeId: string; value: string }> = [];

		// Parse the JSON string
		const parsed = JSON.parse(productAttributes);

		if (Array.isArray(parsed)) {
			// Array format: [{attributeId: "bevel", value: "..."}, ...]
			attributesToCheck = parsed;
		} else if (typeof parsed === 'object' && parsed !== null) {
			// Object format: {"bevel": "без фаски", "length-mm": "600", ...}
			attributesToCheck = Object.entries(parsed).map(([key, value]) => ({
				attributeId: key,
				value: String(value)
			}));
		} else {
			// Invalid format
			return false;
		}

		if (!attributesToCheck.length) return false;

		// Create sets for both slugs and IDs to check against
		const availableSlugs = new Set(availableAttributes.map((a) => a.slug));
		const availableIds = new Set(availableAttributes.map((a) => a.id.toString()));

		// Check if any attribute is not in the standardized list
		return attributesToCheck.some((attr) => {
			// Check if attributeId matches a slug (common case for database format)
			if (availableSlugs.has(attr.attributeId)) {
				return false; // Valid - found in standardized slugs
			}
			// Check if attributeId matches an ID (common case after conversion)
			if (availableIds.has(attr.attributeId)) {
				return false; // Valid - found in standardized IDs
			}
			// Not found in either slugs or IDs - it's out-of-scope!
			return true;
		});
	} catch {
		// If parsing fails, assume no out-of-scope attributes
		return false;
	}
}

/**
 * Count products with out-of-scope attributes from a list of products
 * Efficient - no database queries, just calculation on client-side data
 */
export function countProductsWithErrors(
	products: Array<{ productAttributes?: string | null }>,
	availableAttributes: ProductAttribute[] | undefined
): number {
	if (!products || !availableAttributes?.length) {
		return 0;
	}

	return products.filter((product) =>
		hasOutOfScopeAttributes(product.productAttributes, availableAttributes)
	).length;
}


