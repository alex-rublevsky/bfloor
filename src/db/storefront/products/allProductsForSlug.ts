import { db } from "@/db";
import { type StorefrontProduct } from "./types";

export async function getProductsForSlugPages(): Promise<StorefrontProduct[]> {
  const products = await db.query.products.findMany({
    where: { isActive: true },
    with: {
      category: { columns: { name: true, slug: true } },
      brand: { columns: { name: true, slug: true, image: true } },
      collection: { columns: { name: true, slug: true } },
      storeLocations: { columns: { storeLocationId: true } },
      // variations: { orderBy: { weight: "desc" } },
    },
  });

  return products.map((product) => ({
    ...product,
    storeLocations: product.storeLocations.map(
      ({ storeLocationId }) => storeLocationId,
    ),
  }));
}
