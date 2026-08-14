import { db } from "@/db/index";
import { categories } from "@/db/schema";
import { eq, type InferSelectModel } from "drizzle-orm";

export type Category = Pick<
  InferSelectModel<typeof categories>,
  "id" | "name" | "image" | "slug"
>;

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
