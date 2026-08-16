import { db } from "@/db/index";
import { categories } from "@/db/schema";
import type {
  CreateCategoryInput,
  Category,
} from "@/db/dashboard/categories/types";

export async function createCategory(
  category: CreateCategoryInput,
): Promise<Category> {
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
