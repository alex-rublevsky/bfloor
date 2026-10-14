import { db } from "@/db/index";
import { attributeValues } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { UpdateAttributeValueInput } from "./types";
import type { AttributeValue } from "@/db/schema";

export async function updateAttributeValue(
  attributeValue: UpdateAttributeValueInput,
): Promise<AttributeValue | null> {
  const [updatedAttributeValue] = await db
    .update(attributeValues)
    .set({
      name: attributeValue.name,
      normalizedName: attributeValue.normalizedName,
      slug: attributeValue.slug,
    })
    .where(eq(attributeValues.id, attributeValue.id))
    .returning();

  return updatedAttributeValue ?? null;
}
