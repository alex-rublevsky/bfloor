import { db } from "@/db/index";
import { categories } from "@/db/schema";
import type { Category, NewCategory } from "@/db/schema";

export async function createCategory(category: NewCategory): Promise<Category> {
  const insertedCategory = await db
    .insert(categories)
    .values({
      slug: category.slug,
      name: category.name,
      description: category.description,
      hiddenAttributes: category.hiddenAttributes,
    })
    .returning()
    .then((res) => res[0]);

  return { ...insertedCategory };
}
