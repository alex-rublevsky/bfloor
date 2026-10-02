import { db } from "@/db/index";
import { brands } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { UpdateBrandInput } from "@/db/dashboard/brands/types";
import type { Brand } from "@/db/schema";

export async function updateBrand(brand: UpdateBrandInput): Promise<Brand> {
  const updatedBrand = await db
    .update(brands)
    .set({
      slug: brand.slug,
      name: brand.name,
      countryId: brand.countryId,
    })
    .where(eq(brands.id, brand.id))
    .returning()
    .then((res) => res[0]);

  if (!updatedBrand) {
    throw new Error(`Бренд с id ${brand.id} не был найден`);
  }

  return updatedBrand;
}
