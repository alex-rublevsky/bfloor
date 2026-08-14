import { db } from "@/db/index";
import { categories } from "@/db/schema";
import { eq, type InferSelectModel } from "drizzle-orm";

export type Category = Pick<InferSelectModel<typeof categories>, "id">;

export async function deleteCategory(category: Category): Promise<Category> {
  const insertedCategory = await db
    .delete(categories)
    .where(eq(categories.id, category.id))
    .returning()
    .then((res) => res[0]);

  return { ...insertedCategory };
}
