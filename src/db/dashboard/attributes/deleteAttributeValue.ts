import { db } from "@/db/index";
import { attributeValues } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { DeleteAttributeValueInput } from "./types";
import type { AttributeValue } from "@/db/schema";

export async function deleteAttributeValue(
  attributeValue: DeleteAttributeValueInput,
): Promise<AttributeValue | null> {
  const deletedAttributeValue = await db
    .delete(attributeValues)
    .where(eq(attributeValues.id, attributeValue.id))
    .returning()
    .then((res) => res[0]);

  return { ...deletedAttributeValue };
}
