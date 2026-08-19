import { db } from "@/db/index";
import { type Product } from "../types";

export async function getAllProductsByCategory(
  categoryId?: number,
  page?: number,
): Promise<Product[] | null> {
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
    orderBy: {
      viewCount: "desc",
    },
  });
}
