import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { DB } from "~/db";
import { productAttributes, variationAttributes } from "~/schema";

export const deleteProductAttribute = createServerFn({ method: "POST" })
	.inputValidator((data: { id: number }) => data)
	.handler(async ({ data }): Promise<{ message: string }> => {
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

		// Check if attribute is being used in any variations
		const attributeInUse = await db
			.select()
			.from(variationAttributes)
			.where(eq(variationAttributes.attributeId, existingAttribute[0].name))
			.limit(1);

		if (attributeInUse.length > 0) {
			throw new Error(
				"Cannot delete attribute that is being used in product variations",
			);
		}

		await db.delete(productAttributes).where(eq(productAttributes.id, data.id));

		return {
			message: "Product attribute deleted successfully",
		};
	});
