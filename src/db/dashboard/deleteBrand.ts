import { db } from "@/db/index";
import { brands } from "@/db/schema";
import { eq, type InferSelectModel } from "drizzle-orm";

export type Brand = Pick<InferSelectModel<typeof brands>, "id">;

export async function deleteBrand(brand: Brand): Promise<Brand> {
  const insertedBrand = await db
    .delete(brands)
    .where(eq(brands.id, brand.id))
    .returning()
    .then((res) => res[0]);

  return { ...insertedBrand };
}
