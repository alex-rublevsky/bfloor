import { db } from "@/db/index";
import { categories } from "@/db/schema";
import { type InferSelectModel } from "drizzle-orm";

export type Category = Pick<
  InferSelectModel<typeof categories>,
  "slug" | "name"
  // | "image"
>;

export async function createCategory(category: Category): Promise<Category> {
  const insertedCategory = await db
    .insert(categories)
    .values({
      slug: category.slug,
      name: category.name,
    })
    .returning()
    .then((res) => res[0]);

  return { ...insertedCategory };
}
