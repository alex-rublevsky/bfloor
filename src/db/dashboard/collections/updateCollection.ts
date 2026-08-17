import { db } from "@/db/index";
import { collections } from "@/db/schema";
import { eq } from "drizzle-orm";
import type {
  UpdateCollectionInput,
  Collection,
} from "@/db/dashboard/collections/types";

export async function updateCollection(
  collection: UpdateCollectionInput,
): Promise<Collection> {
  const insertedCollection = await db
    .update(collections)
    .set({
      slug: collection.slug,
      name: collection.name,
      brandId: collection.brandId,
    })
    .where(eq(collections.id, collection.id))
    .returning()
    .then((res) => res[0]);

  return insertedCollection;
}
