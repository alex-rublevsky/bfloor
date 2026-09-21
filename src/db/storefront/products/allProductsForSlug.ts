import { db } from "@/db";
import { type StorefrontProduct } from "./types";

export async function getProductsForSlugPages(): Promise<StorefrontProduct[]> {
  return await db.query.products.findMany({
    where: { isActive: true },
    with: {
      category: { columns: { name: true, slug: true } },
      brand: { columns: { name: true, slug: true, image: true } },
      collection: { columns: { name: true, slug: true } },
      productStoreLocations: { columns: { storeLocationId: true } },
      // variations: { orderBy: { weight: "desc" } },
    },
  });
}
