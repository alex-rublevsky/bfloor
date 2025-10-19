import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { DB } from "~/db";
import { productAttributes } from "~/schema";
import type { ProductAttribute } from "~/types";

export const updateProductAttribute = createServerFn({ method: "POST" })
	.inputValidator(
		(data: { id: number; data: Partial<ProductAttribute> }) => data,
	)
	.handler(
		async ({
			data,
		}): Promise<{ attribute: ProductAttribute; message: string }> => {
			const db = DB();

			// Check if attribute exists
			const existingAttribute = await db
				.select()
				.from(productAttributes)
				.where(eq(productAttributes.id, data.id))
				.limit(1);

			if (existingAttribute.length === 0) {
				throw new Error("Product attribute not found");
			}

			// Prepare update data
			const updateData: Partial<ProductAttribute> = { ...data.data };

			// Check for duplicate name if name is being updated
			if (data.data.name && data.data.name !== existingAttribute[0].name) {
				const duplicateAttribute = await db
					.select()
					.from(productAttributes)
					.where(eq(productAttributes.name, data.data.name))
					.limit(1);

				if (duplicateAttribute.length > 0) {
					throw new Error(
						`Attribute with name "${data.data.name}" already exists`,
					);
				}
			}

			// Check for duplicate slug if slug is being updated
			if (data.data.slug && data.data.slug !== existingAttribute[0].slug) {
				const duplicateSlug = await db
					.select()
					.from(productAttributes)
					.where(eq(productAttributes.slug, data.data.slug))
					.limit(1);

				if (duplicateSlug.length > 0) {
					throw new Error(`Attribute with slug "${data.data.slug}" already exists`);
				}
			}

			const updatedAttribute = await db
				.update(productAttributes)
				.set(updateData)
				.where(eq(productAttributes.id, data.id))
				.returning();

			return {
				attribute: updatedAttribute[0],
				message: "Product attribute updated successfully",
			};
		},
	);
