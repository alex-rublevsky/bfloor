import { categories } from "@/db/schema";
import { db } from "@/db/index";
import { type InferSelectModel } from "drizzle-orm";

export type Category = Pick<
  InferSelectModel<typeof categories>,
  "id" | "name" | "slug" | "image"
>;

export async function getAllCategories(): Promise<Category[]> {
  return db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      image: categories.image
      // sort: categories.sort,
    })
    .from(categories)
    .all();
}
