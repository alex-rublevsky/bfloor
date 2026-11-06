import { db } from "@/db/index";
import type { Product } from "@/db/schema";

export async function getAllProductsByCategory(
  categoryId: number,
  page: number,
): Promise<Product[] | null> {
  if (!categoryId) return null;

  const safePage = Math.max(1, Math.floor(page));
  const offset = (safePage - 1) * 50;
  return await db.query.products.findMany({
    where: {
      categoryId: categoryId,
    },
    limit: 50,
    offset: offset,
  });
}
