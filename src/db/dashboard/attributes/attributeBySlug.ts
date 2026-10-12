import { db } from "@/db/index";
import type { Attribute } from "@/db/schema";

export async function getAttributeBySlug(
  slug?: string,
): Promise<Attribute | null> {
  if (!slug) throw new Error("slug is required");

  const row = await db.query.attributes.findFirst({
    where: {
      slug: slug,
    },
  });

  return row ?? null;
}
