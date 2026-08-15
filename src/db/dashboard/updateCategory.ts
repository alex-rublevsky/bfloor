import { db } from "@/db/index";
import { categories } from "@/db/schema";
import { eq, type InferSelectModel } from "drizzle-orm";

export type Category = Pick<
  InferSelectModel<typeof categories>,
  "id" | "slug" | "name"
>;

export async function updateCategory(category: Category) {
  const insertedCategory = await db
    .update(categories)
    .set({
      slug: category.slug,
      name: category.name,
    })
    .where(eq(categories.id, category.id))
    .returning()
    .then((res) => res[0]);

  return insertedCategory;
}
