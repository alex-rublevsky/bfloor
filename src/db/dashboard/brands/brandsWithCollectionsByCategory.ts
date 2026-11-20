import { db } from "@/db";
import { asc } from "drizzle-orm";
import type { BrandWithCollections } from "./types";

export async function getBrandsWithCollectionsByCategory(
  categoryId: number,
): Promise<BrandWithCollections[]> {
  return await db.query.brands.findMany({
    where: {
      products: {
        categoryId,
      },
    },
    orderBy: (brand) => asc(brand.name),
    with: {
      collections: {
        orderBy: (collection) => asc(collection.name),
      },
    },
  });
}
