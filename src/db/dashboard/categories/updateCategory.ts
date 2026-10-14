import { db } from "@/db/index";
import { categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { UpdateCategoryInput } from "@/db/dashboard/categories/types";
import type { Category } from "@/db/schema";

export async function updateCategory(
  category: UpdateCategoryInput,
): Promise<Category | null> {
  const [updatedCategory] = await db
    .update(categories)
    .set({
      slug: category.slug,
      name: category.name,
      description: category.description,
      hiddenAttributes: category.hiddenAttributes,
    })
    .where(eq(categories.id, category.id))
    .returning();

  return updatedCategory ?? null;
}
