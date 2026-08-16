import { db } from "@/db/index";
import type { Category } from "@/db/dashboard/categories/types";

export async function getCategoryBySlug(
  slug?: string,
): Promise<Category | null> {
  if (!slug) throw new Error("slug is required");

  const row = await db.query.categories.findFirst({
    where: {
      slug: slug,
    },
  });

  return row ?? null;
}
