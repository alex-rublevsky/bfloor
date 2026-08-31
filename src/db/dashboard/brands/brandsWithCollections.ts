import { db } from "@/db";
import type { BrandWithCollections } from "./types";
export async function getBrandsWithCollections(): Promise<
  BrandWithCollections[]
> {
  return await db.query.brands.findMany({
    orderBy: (brands, { asc }) => asc(brands.name),
    with: {
      collections: {
        orderBy: (collections, { asc }) => asc(collections.name),
      },
    },
  });
}
