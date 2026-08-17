import { db } from "@/db/index";
import type { Collection } from "@/db/dashboard/collections/types";

export async function getCollectionBySlug(
  slug?: string,
): Promise<Collection | null> {
  if (!slug) throw new Error("slug is required");

  const row = await db.query.collections.findFirst({
    where: {
      slug: slug,
    },
  });

  return row ?? null;
}
