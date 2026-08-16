import { db } from "@/db/index";
import { brands } from "@/db/schema";
import type { CreateBrandInput, Brand } from "@/db/dashboard/brands/types";

export async function createBrand(brand: CreateBrandInput): Promise<Brand> {
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
