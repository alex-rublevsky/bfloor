import { db } from "@/db/index";
import { products, type Product } from "@/db/schema";
import { and, eq } from "drizzle-orm";

interface ProductFilters {
  brandId?: number | null;
  collectionId?: number | null;
}

export async function getAllProductsByCategory(
  categoryId: number | null,
  page: number,
  filters: ProductFilters = {},
): Promise<Product[] | null> {
  const safePage = Math.max(1, Math.floor(page));
  const offset = (safePage - 1) * 50;
  const conditions = [
    categoryId ? eq(products.categoryId, categoryId) : undefined,
    filters.brandId ? eq(products.brandId, filters.brandId) : undefined,
    filters.collectionId
      ? eq(products.collectionId, filters.collectionId)
      : undefined,
  ];

  return await db
    .select()
    .from(products)
    .where(and(...conditions))
    .limit(50)
    .offset(offset);
}
