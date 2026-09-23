import { db } from "@/db/index";
import type { StorefrontProduct } from "./types";

export async function getAllProductsByCategory(
  categoryId?: number,
  page?: number,
): Promise<StorefrontProduct[] | null> {
  if (!categoryId) return null;

  const pageSize = 50;
  const safePage = Math.max(1, Math.floor(page ?? 1));
  const offset = (safePage - 1) * pageSize;

  return await db.query.products.findMany({
    limit: pageSize,
    offset: offset,
    where: {
      categoryId: categoryId,
    },
    with: {
      category: { columns: { name: true, slug: true } },
      brand: { columns: { name: true, slug: true, image: true } },
      collection: { columns: { name: true, slug: true } },
      productStoreLocations: { columns: { storeLocationId: true } },
    },
    orderBy: {
      viewCount: "desc",
    },
  });
}
