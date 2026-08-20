import { db } from "@/db/index";
import { attributes } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { UpdateAttributeInput, Attribute } from "./types";

export async function updateAttribute(
  attribute: UpdateAttributeInput,
): Promise<Attribute> {
  const insertedAttribute = await db
    .update(attributes)
    .set({
      slug: attribute.slug,
      name: attribute.name,
    })
    .where(eq(attributes.id, attribute.id))
    .returning()
    .then((res) => res[0]);

  return insertedAttribute;
}
