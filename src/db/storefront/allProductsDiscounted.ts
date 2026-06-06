import { db } from "@/db/index";
import { categories, products } from "@/db/schema";
import { eq, isNotNull, or, sql } from "drizzle-orm";

export type Product = {
  slug: string;
  name: string;
  categorySlug: string;
  images: string[];
  price: number | null;
  discountedPrice: number | null;
};

export async function getDiscountedProducts(): Promise<Product[]> {
  return db
    .select({
      slug: products.slug,
      name: products.name,
      categorySlug: categories.slug,
      images: products.images,
      price: products.price,
      discountedPrice: products.discountedPrice,
      //   sql<number | null>`COALESCE(
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
    .limit(50);
}
