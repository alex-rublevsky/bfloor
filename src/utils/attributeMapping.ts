/**
 * Attribute Mapping Utilities
 *
 * Provides efficient mapping between attribute IDs and slugs with caching
 */

import { DB } from "~/db";
import { productAttributes } from "~/schema";

// Type for attribute from database
type Attribute = {
	id: number;
	slug: string;
	name: string;
	valueType: string;
	allowMultipleValues: boolean;
};

// Cache for attribute mappings (refreshed every 5 minutes)
let attributeCache: {
	attributes: Attribute[];
	idToSlug: Map<number, string>;
	slugToId: Map<string, number>;
	timestamp: number;
} | null = null;

const CACHE_TTL = 48 * 60 * 60 * 1000; // 48 hours

/**
 * Get all attribute mappings with caching
 * Returns both ID->slug and slug->ID maps
 */
export async function getAttributeMappings(): Promise<{
	attributes: Attribute[];
	idToSlug: Map<number, string>;
	slugToId: Map<string, number>;
	timestamp: number;
}> {
	const now = Date.now();

	// Return cached data if still valid
	if (attributeCache && now - attributeCache.timestamp < CACHE_TTL) {
		return attributeCache;
	}

	// Fetch fresh data
	const db = DB();
	const attributes = await db.select().from(productAttributes).all();

	// Build maps efficiently using Map constructor
	const idToSlug = new Map(
		attributes.map((attr) => [attr.id, attr.slug] as const),
	);

	const slugToId = new Map(
		attributes.map((attr) => [attr.slug, attr.id] as const),
	);

	// Update cache
	attributeCache = {
		attributes,
		idToSlug,
		slugToId,
		timestamp: now,
	};

	return attributeCache;
}

/**
 * Convert attribute ID to slug
 */
export async function attributeIdToSlug(
	id: number | string,
): Promise<string | null> {
	const { idToSlug } = await getAttributeMappings();
	const numId = typeof id === "string" ? parseInt(id, 10) : id;
	return idToSlug.get(numId) || null;
}

/**
 * Convert attribute slug to ID
 */
export async function attributeSlugToId(slug: string): Promise<number | null> {
	const { slugToId } = await getAttributeMappings();
	return slugToId.get(slug) || null;
}

/**
 * Convert multiple attribute IDs to slugs
 */
export async function attributeIdsToSlugs(
	ids: (number | string)[],
): Promise<Map<string, string>> {
	const { idToSlug } = await getAttributeMappings();
	const result = new Map<string, string>();

	for (const id of ids) {
		const numId = typeof id === "string" ? parseInt(id, 10) : id;
		const slug = idToSlug.get(numId);
		if (slug) {
			result.set(id.toString(), slug);
		}
	}

	return result;
}

/**
 * Convert product attributes from ID-based to slug-based format
 * Input: [{ attributeId: "5", value: "Дерево,Камень" }]
 * Output: { "design": ["Дерево", "Камень"] }
 */
export async function convertAttributesToSlugFormat(
	attributes: Array<{ attributeId: string; value: string }>,
): Promise<Record<string, string[]>> {
	if (!attributes?.length) {
		return {};
	}

	const { idToSlug } = await getAttributeMappings();
	const result: Record<string, string[]> = {};

	for (const attr of attributes) {
		if (!attr.value?.trim()) continue;

		// Convert attribute ID to slug
		const slug =
			idToSlug.get(parseInt(attr.attributeId, 10)) || attr.attributeId;

		// Split comma-separated values and store as array
		const values = attr.value
			.split(",")
			.map((v) => v.trim())
			.filter(Boolean);

		if (values.length > 0) {
			result[slug] = values;
		}
	}

	return result;
}

/**
 * Invalidate the attribute cache (call after modifying attributes)
 */
export function invalidateAttributeCache() {
	attributeCache = null;
}
