import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { DB } from "~/db";
import { attributeValues } from "~/schema";

export interface AttributeValue {
	id: number;
	attributeId: number;
	value: string;
	slug: string | null;
	sortOrder: number;
	isActive: boolean;
	createdAt: number | null;
}

/**
 * Get all attribute values grouped by attribute ID
 * Used for displaying values on the attributes list page
 */
export const getAllAttributeValuesByAttribute = createServerFn({ method: "GET" })
	.inputValidator(() => ({}))
	.handler(async (): Promise<Record<number, AttributeValue[]>> => {
		const db = DB();

		// Get all active attribute values, sorted by attribute_id and sort_order
		const allValues = await db
			.select()
			.from(attributeValues)
			.where(eq(attributeValues.isActive, true));

		// Sort in JavaScript: first by attributeId, then by sortOrder
		allValues.sort((a, b) => {
			if (a.attributeId !== b.attributeId) {
				return a.attributeId - b.attributeId;
			}
			return a.sortOrder - b.sortOrder;
		});

		// Group by attributeId
		const grouped: Record<number, AttributeValue[]> = {};

		for (const value of allValues) {
			if (!grouped[value.attributeId]) {
				grouped[value.attributeId] = [];
			}
			grouped[value.attributeId].push({
				id: value.id,
				attributeId: value.attributeId,
				value: value.value,
				slug: value.slug || null,
				sortOrder: value.sortOrder,
				isActive: value.isActive,
				createdAt: value.createdAt ? Number(value.createdAt) : null,
			});
		}

		return grouped;
	});

