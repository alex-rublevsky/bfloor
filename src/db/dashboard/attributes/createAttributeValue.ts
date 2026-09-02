import { db } from "@/db/index";
import { attributeValues } from "@/db/schema";
import type { CreateAttributeValueInput, AttributeValue } from "./types";

export async function createAttributeValue(
  attributeValue: CreateAttributeValueInput,
): Promise<AttributeValue> {
  const insertedAttributeValue = await db
    .insert(attributeValues)
    .values({
      slug: attributeValue.slug,
      name: attributeValue.name,
      normalizedName: attributeValue.normalizedName,
      attributeId: attributeValue.attributeId,
    })
    .returning()
    .then((res) => res[0]);

  return { ...insertedAttributeValue };
}
