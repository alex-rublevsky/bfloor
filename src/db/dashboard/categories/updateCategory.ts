import { db } from "@/db/index";
import { categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import type {
  UpdateCategoryInput,
  Category,
} from "@/db/dashboard/categories/types";

export async function updateCategory(
  category: UpdateCategoryInput,
): Promise<Category> {
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
