import { db } from "@/db/index";
import { categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import type {
  DeleteCategoryInput,
  Category,
} from "@/db/dashboard/categories/types";

export async function deleteCategory(
  category: DeleteCategoryInput,
): Promise<Category | null> {
  const insertedCategory = await db
    .delete(categories)
    .where(eq(categories.id, category.id))
    .returning()
    .then((res) => res[0]);

  return { ...insertedCategory };
}
