import { db } from "@/db/index";
import { brands } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { DeleteBrandInput, Brand } from "@/db/dashboard/brands/types";

export async function deleteBrand(
  brand: DeleteBrandInput,
): Promise<Brand | null> {
  const insertedBrand = await db
    .delete(brands)
    .where(eq(brands.id, brand.id))
    .returning()
    .then((res) => res[0]);

  return { ...insertedBrand };
}
