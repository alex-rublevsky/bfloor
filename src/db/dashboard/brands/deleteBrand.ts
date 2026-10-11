import { db } from "@/db/index";
import { brands } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { DeleteBrandInput } from "@/db/dashboard/brands/types";
import type { Brand } from "@/db/schema";

export async function deleteBrand(
  brand: DeleteBrandInput,
): Promise<Brand | null> {
  const [insertedBrand] = await db
    .delete(brands)
    .where(eq(brands.id, brand.id))
    .returning();

  return insertedBrand ?? null;
}
