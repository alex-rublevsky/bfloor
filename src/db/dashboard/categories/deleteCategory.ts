import { db } from "@/db/index";
import { categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { DeleteCategoryInput } from "@/db/dashboard/categories/types";
import type { Category } from "@/db/schema";

export async function deleteCategory(
  category: DeleteCategoryInput,
): Promise<Category | null> {
  const [insertedCategory] = await db
    .delete(categories)
    .where(eq(categories.id, category.id))
    .returning();

  return insertedCategory ?? null;
}
