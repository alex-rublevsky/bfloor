import { db } from "@/db/index";
import { collections } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { DeleteCollectionInput } from "./types";
import type { Collection } from "@/db/schema";

export async function deleteCollection(
  collection: DeleteCollectionInput,
): Promise<Collection | null> {
  const [insertedCollection] = await db
    .delete(collections)
    .where(eq(collections.id, collection.id))
    .returning();

  return insertedCollection ?? null;
}
