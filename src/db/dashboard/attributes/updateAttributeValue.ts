import { db } from "@/db/index";
import { attributeValues } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { UpdateAttributeValueInput, AttributeValue } from "./types";

export async function updateAttributeValue(
  attributeValue: UpdateAttributeValueInput,
): Promise<AttributeValue> {
  const insertedAttributeValue = await db
    .update(attributeValues)
    .set({
      slug: attributeValue.slug,
      name: attributeValue.name,
    })
    .where(eq(attributeValues.id, attributeValue.id))
    .returning()
    .then((res) => res[0]);

  return insertedAttributeValue;
}
