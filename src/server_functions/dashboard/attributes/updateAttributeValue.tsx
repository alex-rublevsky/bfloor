import { createServerFn } from "@tanstack/react-start";
import { and, eq, ne } from "drizzle-orm";
import { DB } from "~/db";
import { attributeValues } from "~/schema";
import type { AttributeValue } from "./getAttributeValues";
import { updateAttributeValueInProducts } from "~/utils/updateAttributeValueInProducts";

export const updateAttributeValue = createServerFn({ method: "POST" })
	.inputValidator(
		(data: {
			id: number;
			data: {
				value?: string;
				slug?: string | null;
				sortOrder?: number;
				isActive?: boolean;
			};
		}) => data,
	)
	.handler(
		async ({
			data,
		}): Promise<{ value: AttributeValue; message: string }> => {
			const db = DB();

			// Get existing value to check attributeId
			const existing = await db
				.select()
				.from(attributeValues)
				.where(eq(attributeValues.id, data.id))
				.limit(1);

			if (existing.length === 0) {
				throw new Error("Attribute value not found");
			}

			const attributeId = existing[0].attributeId;
			const oldValue = existing[0].value;

			// If value is being changed, check for duplicates (excluding current value)
			if (data.data.value && data.data.value !== oldValue) {
				const duplicate = await db
					.select()
					.from(attributeValues)
					.where(
						and(
							eq(attributeValues.attributeId, attributeId),
							eq(attributeValues.value, data.data.value),
							ne(attributeValues.id, data.id), // Exclude current value
						),
					)
					.limit(1);

				if (duplicate.length > 0) {
					throw new Error(
						`Value "${data.data.value}" already exists for this attribute`,
					);
				}

				// Update the value in all products that have it
				await updateAttributeValueInProducts(
					db,
					attributeId,
					oldValue,
					data.data.value,
				);
			}

			const updateData: {
				value?: string;
				slug?: string | null;
				sortOrder?: number;
				isActive?: boolean;
			} = {};

			if (data.data.value !== undefined) {
				updateData.value = data.data.value;
			}
			if (data.data.slug !== undefined) {
				updateData.slug = data.data.slug;
			}
			if (data.data.sortOrder !== undefined) {
				updateData.sortOrder = data.data.sortOrder;
			}
			if (data.data.isActive !== undefined) {
				updateData.isActive = data.data.isActive;
			}

			const updated = await db
				.update(attributeValues)
				.set(updateData)
				.where(eq(attributeValues.id, data.id))
				.returning();

			return {
				value: {
					id: updated[0].id,
					attributeId: updated[0].attributeId,
					value: updated[0].value,
					slug: updated[0].slug || null,
					sortOrder: updated[0].sortOrder,
					isActive: updated[0].isActive,
					createdAt: updated[0].createdAt
						? Number(updated[0].createdAt)
						: null,
				},
				message: "Attribute value updated successfully",
			};
		},
	);

