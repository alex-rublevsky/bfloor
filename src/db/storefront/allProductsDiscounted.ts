import { db } from "@/db/index";
import { categories, products } from "@/db/schema";
import type { StorefrontProductCard } from "@/db/storefront/products/types";
import { eq, isNotNull, or, sql, count } from "drizzle-orm";

export type DiscountedProduct = StorefrontProductCard & {
  totalDiscountedCount: number;
};

export async function getDiscountedProducts(): Promise<DiscountedProduct[]> {
  return db
    .select({
      slug: products.slug,
      name: products.name,
      categorySlug: categories.slug,
      images: products.images,
      price: products.price,
      discountedPrice: products.discountedPrice,
      unitOfMeasurement: products.unitOfMeasurement,
      totalDiscountedCount: sql<number>`count(*) over ()`, //   sql<number | null>`COALESCE(
      //   ${products.discountedPrice},
      //   (SELECT MIN(${productVariations.discountedPrice})
      //    FROM ${productVariations}
      //    WHERE ${productVariations.productId} = ${products.id}
      //      AND ${productVariations.isActive} = 1
      //      AND ${productVariations.discountedPrice} IS NOT NULL)
      // )`,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(
      or(
        isNotNull(products.discountedPrice),
        // sql`EXISTS (
        //   SELECT 1
        //   FROM ${productVariations}
        //   WHERE ${productVariations.productId} = ${products.id}
        //     AND ${productVariations.isActive} = 1
        //     AND ${productVariations.discountedPrice} IS NOT NULL
        // )`,
      ),
    )
    .limit(30);
}
