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
 * Get all attribute values for a specific attribute
 * Returns values sorted by sort_order
 */
export const getAttributeValues = createServerFn({ method: "GET" })
	.inputValidator((data: { attributeId: number }) => data)
	.handler(async ({ data }): Promise<AttributeValue[]> => {
		const db = DB();

		const values = await db
			.select()
			.from(attributeValues)
			.where(eq(attributeValues.attributeId, data.attributeId))
			.orderBy(attributeValues.sortOrder);

		return values.map((v) => ({
			id: v.id,
			attributeId: v.attributeId,
			value: v.value,
			slug: v.slug || null,
			sortOrder: v.sortOrder,
			isActive: v.isActive,
			createdAt: v.createdAt ? Number(v.createdAt) : null,
		}));
	});


