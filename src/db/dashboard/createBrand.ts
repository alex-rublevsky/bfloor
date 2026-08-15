import { db } from "@/db/index";
import { brands } from "@/db/schema";
import { type InferSelectModel } from "drizzle-orm";

export type Brand = Pick<
  InferSelectModel<typeof brands>,
  "slug" | "name"
  // | "image"
>;

export async function createBrand(brand: Brand): Promise<Brand> {
  const insertedBrand = await db
    .insert(brands)
    .values({
      slug: brand.slug,
      name: brand.name,
    })
    .returning()
    .then((res) => res[0]);

  return { ...insertedBrand };
}
