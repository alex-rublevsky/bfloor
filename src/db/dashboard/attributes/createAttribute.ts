import { db } from "@/db/index";
import { attributes } from "@/db/schema";
import type { CreateAttributeInput, Attribute } from "./types";

export async function createAttribute(
  attribute: CreateAttributeInput,
): Promise<Attribute> {
  const insertedAttribute = await db
    .insert(attributes)
    .values({
      slug: attribute.slug,
      name: attribute.name,
    })
    .returning()
    .then((res) => res[0]);

  return { ...insertedAttribute };
}
