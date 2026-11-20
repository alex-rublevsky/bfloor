import { db } from "@/db/index";
import { asc, sql } from "drizzle-orm";
import type { Product } from "@/db/schema";

export type DashboardProductCardData = Omit<
  Product,
  "price" | "discountedPrice"
> & {
  price: number | null;
  discountedPrice: number | null;
  hasVariations: boolean;
};

interface ProductFilters {
  brandId?: number | null;
  collectionId?: number | null;
}

export async function getAllProductsByCategory(
  categoryId: number | null,
  page: number,
  filters: ProductFilters = {},
): Promise<DashboardProductCardData[]> {
  const safePage = Math.max(1, Math.floor(page));
  const offset = (safePage - 1) * 100;
  const rows = await db.query.products.findMany({
    where: {
      categoryId: categoryId || undefined,
      brandId: filters.brandId || undefined,
      collectionId: filters.collectionId || undefined,
    },
    with: {
      variations: {
        columns: {
          id: true,
          price: true,
          discountedPrice: true,
        },
        orderBy: (variation) => [
          asc(sql`coalesce(${variation.discountedPrice}, ${variation.price})`),
          asc(variation.id),
        ],
        limit: 1,
      },
    },
    limit: 50,
    offset,
  });

  return rows.map(({ variations, ...product }) => {
    const cheapestVariation = variations[0];
    return {
      ...product,
      price: cheapestVariation?.price ?? product.price,
      discountedPrice: cheapestVariation
        ? cheapestVariation.discountedPrice
        : product.discountedPrice,
      hasVariations: Boolean(cheapestVariation),
    };
  });
}
