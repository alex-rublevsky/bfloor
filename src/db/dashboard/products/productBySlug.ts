import { db } from "@/db/index";
import type { ProductWithStoreLocations } from "@/db/dashboard/products/types";

export async function getProductBySlug(
  slug?: string,
): Promise<ProductWithStoreLocations | null> {
  if (!slug) throw new Error("slug is required");

  const row = await db.query.products.findFirst({
    where: {
      slug: slug,
    },
    with: {
      productStoreLocations: {
        columns: {
          storeLocationId: true,
        },
      },
    },
  });
  if (!row) return null;

  return {
    ...row,
    storeLocationIds: row.productStoreLocations.map(
      (location) => location.storeLocationId,
    ),
  };
}
