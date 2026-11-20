import { db } from "@/db/index";
import { and, asc, count, eq, sql } from "drizzle-orm";
import { products, type Product } from "@/db/schema";

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

const PAGE_SIZE = 50;

export async function getDashboardProductCount(
  categoryId: number | null,
  filters: ProductFilters = {},
): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(products)
    .where(andFilters(categoryId, filters));
  return result.count;
}

function andFilters(categoryId: number | null, filters: ProductFilters) {
  const conditions = [];
  if (categoryId) conditions.push(eq(products.categoryId, categoryId));
  if (filters.brandId) conditions.push(eq(products.brandId, filters.brandId));
  if (filters.collectionId) {
    conditions.push(eq(products.collectionId, filters.collectionId));
  }
  return conditions.length ? and(...conditions) : undefined;
}

export async function getAllProductsByCategory(
  categoryId: number | null,
  page: number,
  filters: ProductFilters = {},
): Promise<DashboardProductCardData[]> {
  const safePage = Math.max(1, Math.floor(page));
  const offset = (safePage - 1) * PAGE_SIZE;
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
    orderBy: (product) => [asc(product.id)],
    limit: PAGE_SIZE,
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
