import { createServerFn } from "@tanstack/react-start";
import { eq, inArray, type SQL, sql } from "drizzle-orm";
import { DB } from "~/db";
import { attributeValues, productAttributes, products } from "~/schema";

export interface AttributeFilterValue {
	id: number;
	value: string;
	slug: string | null;
	count: number; // Number of products with this value in current context
}

export interface AttributeFilter {
	attributeId: number;
	attributeName: string;
	attributeSlug: string;
	values: AttributeFilterValue[];
}

/**
 * Get available attribute values for filtering based on current filters
 * Only returns attributes that have standardized values (valueType = 'standardized' or 'both')
 * Only shows values that exist in products matching the current filter context
 *
 * Note: When showing values for an attribute, we consider filters for category/brand/collection
 * AND all other attribute filters (but not the attribute itself, so users can unselect values)
 */
export const getAttributeValuesForFiltering = createServerFn({ method: "GET" })
	.inputValidator(
		(
			data: {
				categorySlug?: string;
				brandSlug?: string;
				collectionSlug?: string;
				attributeFilters?: Record<number, string[]>; // attributeId -> array of value IDs
			} = {},
		) => data,
	)
	.handler(async ({ data = {} }): Promise<AttributeFilter[]> => {
		const db = DB();

		// First, get all attributes that have standardized values
		const allAttributes = await db
			.select()
			.from(productAttributes)
			.where(sql`${productAttributes.valueType} IN ('standardized', 'both')`);

		if (allAttributes.length === 0) {
			return [];
		}

		// Build where condition for products matching current filters
		const productConditions: SQL[] = [eq(products.isActive, true)];
		if (data.categorySlug) {
			productConditions.push(eq(products.categorySlug, data.categorySlug));
		}
		if (data.brandSlug) {
			productConditions.push(eq(products.brandSlug, data.brandSlug));
		}
		if (data.collectionSlug) {
			productConditions.push(eq(products.collectionSlug, data.collectionSlug));
		}
		const attributeFilters = data.attributeFilters || {};
		const productWhereCondition =
			productConditions.length > 0
				? sql.join(productConditions, sql` AND `)
				: undefined;

		// Get all products matching basic filters (category/brand/collection)
		let matchingProducts = productWhereCondition
			? await db
					.select({
						id: products.id,
						productAttributes: products.productAttributes,
					})
					.from(products)
					.where(productWhereCondition)
			: await db
					.select({
						id: products.id,
						productAttributes: products.productAttributes,
					})
					.from(products);

		// Apply attribute filters if provided
		if (Object.keys(attributeFilters).length > 0) {
			// Get attribute slugs and value mappings
			const allAttributes = await db.select().from(productAttributes);
			const attributeIdToSlug = new Map<number, string>();
			for (const attr of allAttributes) {
				attributeIdToSlug.set(attr.id, attr.slug);
			}

			// Get standardized values for the selected attribute values
			const allValueIds = new Set<number>();
			for (const valueIds of Object.values(attributeFilters)) {
				for (const valueId of valueIds) {
					const numId = parseInt(valueId, 10);
					if (!Number.isNaN(numId)) {
						allValueIds.add(numId);
					}
				}
			}

			const stdValues =
				allValueIds.size > 0
					? await db
							.select()
							.from(attributeValues)
							.where(inArray(attributeValues.id, Array.from(allValueIds)))
					: [];

			// Create a map of attributeId -> Set of value strings
			const attributeValueMap = new Map<number, Set<string>>();
			for (const stdValue of stdValues) {
				if (!attributeValueMap.has(stdValue.attributeId)) {
					attributeValueMap.set(stdValue.attributeId, new Set());
				}
				attributeValueMap.get(stdValue.attributeId)?.add(stdValue.value);
			}

			// Filter products by attribute values
			matchingProducts = matchingProducts.filter((product) => {
				if (!product.productAttributes) return false;

				try {
					const parsed = JSON.parse(product.productAttributes);
					let productAttrs: Array<{ attributeId: string; value: string }> = [];

					// Handle both object and array formats
					if (typeof parsed === "object" && parsed !== null) {
						if (Array.isArray(parsed)) {
							productAttrs = parsed;
						} else {
							// Convert object to array format
							productAttrs = Object.entries(parsed).map(([key, value]) => ({
								attributeId: key,
								value: String(value),
							}));
						}
					}

					// Check if product matches all attribute filters
					for (const [attributeId] of Object.entries(attributeFilters)) {
						const attrIdNum = parseInt(attributeId, 10);
						if (Number.isNaN(attrIdNum)) continue;

						const expectedValues = attributeValueMap.get(attrIdNum);
						if (!expectedValues || expectedValues.size === 0) continue;

						// Find product's attribute value
						const productAttr = productAttrs.find((attr) => {
							const numericId = parseInt(attr.attributeId, 10);
							if (!Number.isNaN(numericId) && numericId === attrIdNum) {
								return true;
							}
							const slug = attributeIdToSlug.get(attrIdNum);
							return slug && attr.attributeId === slug;
						});

						if (!productAttr) return false;

						// Check if product's value matches any of the selected values
						const productValues = productAttr.value
							.split(",")
							.map((v) => v.trim())
							.filter(Boolean);

						const hasMatch = productValues.some((pv) => expectedValues.has(pv));
						if (!hasMatch) return false;
					}

					return true;
				} catch {
					// Invalid JSON, exclude product
					return false;
				}
			});
		}

		// Get all standardized attribute values
		const allStandardizedValues = await db
			.select()
			.from(attributeValues)
			.where(eq(attributeValues.isActive, true));

		// Create a map of attributeId -> values
		const valuesByAttribute = new Map<number, typeof allStandardizedValues>();
		for (const value of allStandardizedValues) {
			if (!valuesByAttribute.has(value.attributeId)) {
				valuesByAttribute.set(value.attributeId, []);
			}
			valuesByAttribute.get(value.attributeId)?.push(value);
		}

		// Create a map of attribute slug -> attribute ID
		const slugToIdMap = new Map<string, number>();
		for (const attr of allAttributes) {
			slugToIdMap.set(attr.slug, attr.id);
		}

		// Count occurrences of each attribute value in matching products
		const valueCounts = new Map<string, number>(); // key: "attributeId:value", value: count

		for (const product of matchingProducts) {
			if (!product.productAttributes) continue;

			try {
				const parsed = JSON.parse(product.productAttributes);
				let productAttrs: Array<{ attributeId: string; value: string }> = [];

				// Handle both object and array formats
				if (typeof parsed === "object" && parsed !== null) {
					if (Array.isArray(parsed)) {
						productAttrs = parsed;
					} else {
						// Convert object to array format
						productAttrs = Object.entries(parsed).map(([key, value]) => ({
							attributeId: key,
							value: String(value),
						}));
					}
				}

				// Process each attribute value
				for (const attr of productAttrs) {
					// Resolve attribute ID (could be slug or numeric ID)
					let attributeId: number | null = null;
					const numericId = parseInt(attr.attributeId, 10);
					if (!Number.isNaN(numericId) && slugToIdMap.has(attr.attributeId)) {
						attributeId = numericId;
					} else if (slugToIdMap.has(attr.attributeId)) {
						attributeId = slugToIdMap.get(attr.attributeId) ?? null;
					}

					if (!attributeId) continue;

					// Handle comma-separated values
					const values = attr.value
						.split(",")
						.map((v) => v.trim())
						.filter(Boolean);

					for (const value of values) {
						const key = `${attributeId}:${value}`;
						valueCounts.set(key, (valueCounts.get(key) || 0) + 1);
					}
				}
			} catch {}
		}

		// Build result: only include attributes that have at least one value with count > 0
		const result: AttributeFilter[] = [];

		for (const attr of allAttributes) {
			const values = valuesByAttribute.get(attr.id) || [];
			const filterValues: AttributeFilterValue[] = [];

			for (const stdValue of values) {
				const key = `${attr.id}:${stdValue.value}`;
				const count = valueCounts.get(key) || 0;

				// Only include values that appear in at least one product
				if (count > 0) {
					filterValues.push({
						id: stdValue.id,
						value: stdValue.value,
						slug: stdValue.slug || null,
						count,
					});
				}
			}

			// Only include attributes that have at least one value
			if (filterValues.length > 0) {
				// Sort by sortOrder, then by value
				filterValues.sort((a, b) => {
					const aSortOrder = values.find((v) => v.id === a.id)?.sortOrder ?? 0;
					const bSortOrder = values.find((v) => v.id === b.id)?.sortOrder ?? 0;
					if (aSortOrder !== bSortOrder) {
						return aSortOrder - bSortOrder;
					}
					return a.value.localeCompare(b.value);
				});

				result.push({
					attributeId: attr.id,
					attributeName: attr.name,
					attributeSlug: attr.slug,
					values: filterValues,
				});
			}
		}

		// Sort attributes by name
		result.sort((a, b) => a.attributeName.localeCompare(b.attributeName));

		return result;
	});
