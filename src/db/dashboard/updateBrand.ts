import { db } from "@/db/index";
import { brands } from "@/db/schema";
import { eq, type InferSelectModel } from "drizzle-orm";

export type Brand = Pick<
  InferSelectModel<typeof brands>,
  "id" | "slug" | "name"
>;

export async function updateBrand(brand: Brand) {
  const insertedBrand = await db
    .update(brands)
    .set({
      slug: brand.slug,
      name: brand.name,
    })
    .where(eq(brands.id, brand.id))
    .returning()
    .then((res) => res[0]);

  return insertedBrand;
}
