import { db } from "@/db/index";
import { collections } from "@/db/schema";
import { eq } from "drizzle-orm";
import type {
  DeleteCollectionInput,
  Collection,
} from "@/db/dashboard/collections/types";

export async function deleteCollection(
  collection: DeleteCollectionInput,
): Promise<Collection | null> {
  const insertedCollection = await db
    .delete(collections)
    .where(eq(collections.id, collection.id))
    .returning()
    .then((res) => res[0]);

  return { ...insertedCollection };
}
