import { db } from "@/db/index";
import { brands } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { UpdateBrandInput, Brand } from "@/db/dashboard/brands/types";

export async function updateBrand(brand: UpdateBrandInput): Promise<Brand> {
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
