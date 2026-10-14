import { db } from "@/db/index";
import { collections } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { UpdateCollectionInput } from "./types";
import type { Collection } from "@/db/schema";

export async function updateCollection(
  collection: UpdateCollectionInput,
): Promise<Collection | null> {
  const [updatedCollection] = await db
    .update(collections)
    .set({
      slug: collection.slug,
      name: collection.name,
      brandId: collection.brandId,
    })
    .where(eq(collections.id, collection.id))
    .returning();

  return updatedCollection ?? null;
}
