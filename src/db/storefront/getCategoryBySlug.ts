import { db } from "@/db/index";
import type { Category } from "@/db/schema";

export async function getCategoryBySlug(
  slug?: string,
): Promise<Pick<Category, "id" | "slug" | "name" | "description"> | null> {
  if (!slug) return null;

  const row = await db.query.categories.findFirst({
    columns: { id: true, slug: true, name: true, description: true },
    where: {
      slug: slug,
    },
  });
  return row ?? null;
}
