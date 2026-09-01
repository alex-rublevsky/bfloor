import { db } from "@/db/index";
import { collections } from "@/db/schema";
import type { CreateCollectionInput, Collection } from "./types";

export async function createCollection(
  collection: CreateCollectionInput,
): Promise<Collection> {
  const insertedCollection = await db
    .insert(collections)
    .values({
      slug: collection.slug,
      name: collection.name,
      brandId: collection.brandId,
    })
    .returning()
    .then((res) => res[0]);

  return { ...insertedCollection };
}
