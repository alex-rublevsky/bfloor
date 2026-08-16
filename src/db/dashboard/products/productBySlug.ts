import { db } from "@/db/index";
import type { Product } from "@/db/dashboard/products/types";

export async function getProductBySlug(slug?: string): Promise<Product | null> {
  if (!slug) throw new Error("slug is required");

  const row = await db.query.products.findFirst({
    where: {
      slug: slug,
    },
  });

  return row ?? null;
}
