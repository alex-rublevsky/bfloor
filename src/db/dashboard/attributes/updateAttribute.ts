import { db } from "@/db/index";
import { attributes } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { UpdateAttributeInput } from "./types";
import type { Attribute } from "@/db/schema";

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
