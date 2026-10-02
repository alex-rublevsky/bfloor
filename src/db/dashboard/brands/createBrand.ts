import { db } from "@/db/index";
import { brands } from "@/db/schema";

import type { Brand, NewBrand } from "@/db/schema";

export async function createBrand(brand: NewBrand): Promise<Brand> {
  const insertedBrand = await db
    .insert(brands)
    .values({
      slug: brand.slug,
      name: brand.name,
      countryId: brand.countryId,
    })
    .returning()
    .then((res) => res[0]);

  return { ...insertedBrand };
}
