import { db } from "@/db/index";
import type { Product } from "@/db/dashboard/products/types";

export async function getAllProducts(page: number): Promise<Product[]> {
  const safePage = Math.max(1, Math.floor(page));
  const offset = (safePage - 1) * 50;
  return await db.query.products.findMany({
    limit: 50,
    offset: offset,
  });
}
