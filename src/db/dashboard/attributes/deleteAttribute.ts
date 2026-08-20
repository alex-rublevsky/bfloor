import { db } from "@/db/index";
import { attributes } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { DeleteAttributeInput, Attribute } from "./types";

export async function deleteAttribute(
  attribute: DeleteAttributeInput,
): Promise<Attribute | null> {
  const deletedAttribute = await db
    .delete(attributes)
    .where(eq(attributes.id, attribute.id))
    .returning()
    .then((res) => res[0]);

  return { ...deletedAttribute };
}
