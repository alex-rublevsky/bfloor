import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { DB } from "~/db";
import { attributeValues } from "~/schema";
import { cleanupAttributeValueFromProducts } from "~/utils/cleanupAttributeValueFromProducts";

export const deleteAttributeValue = createServerFn({ method: "POST" })
	.inputValidator((data: { id: number }) => data)
	.handler(
		async ({ data }): Promise<{ message: string; updatedProducts: number }> => {
			const db = DB();

			// Check if value exists
			const existing = await db
				.select()
				.from(attributeValues)
				.where(eq(attributeValues.id, data.id))
				.limit(1);

			if (existing.length === 0) {
				throw new Error("Attribute value not found");
			}

			const valueToDelete = existing[0];
			const attributeId = valueToDelete.attributeId;
			const valueString = valueToDelete.value;

			// Clean up this value from all products before deleting
			const cleanupResult = await cleanupAttributeValueFromProducts(
				db,
				attributeId,
				valueString,
			);

			// Delete the value from attribute_values table
			await db.delete(attributeValues).where(eq(attributeValues.id, data.id));

			return {
				message:
					cleanupResult.updatedCount > 0
						? `Attribute value deleted successfully. Removed from ${cleanupResult.updatedCount} product(s).`
						: "Attribute value deleted successfully.",
				updatedProducts: cleanupResult.updatedCount,
			};
		},
	);
