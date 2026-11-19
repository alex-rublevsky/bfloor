import { db } from "@/db/index";
import { categories, products, variations } from "@/db/schema";
import { and, eq, isNotNull, isNull, or, sql } from "drizzle-orm";
import type { StorefrontProductCard } from "@/db/storefront/products/types";

export type DiscountedProduct = StorefrontProductCard & {
  categorySlug: string;
  totalDiscountedCount: number;
};

export async function getDiscountedProducts(): Promise<DiscountedProduct[]> {
  const rankedVariations = db
    .select({
      productId: variations.productId,
      price: variations.price,
      discountedPrice: variations.discountedPrice,
      rank: sql<number>`row_number() over (
        partition by ${variations.productId}
        order by ${variations.discountedPrice}, ${variations.id}
      )`.as("rank"),
    })
    .from(variations)
    .where(isNotNull(variations.discountedPrice))
    .as("ranked_variations");

  return db
    .select({
      slug: products.slug,
      name: products.name,
      categorySlug: categories.slug,
      images: products.images,
      price: sql<
        number | null
      >`coalesce(${rankedVariations.price}, ${products.price})`,
      discountedPrice: sql<number | null>`case
        when ${rankedVariations.productId} is null then ${products.discountedPrice}
        else ${rankedVariations.discountedPrice}
      end`,
      unitOfMeasurement: products.unitOfMeasurement,
      hasVariations: sql<boolean>`${rankedVariations.productId} is not null`,
      totalDiscountedCount: sql<number>`count(*) over ()`,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(
      rankedVariations,
      and(
        eq(products.id, rankedVariations.productId),
        eq(rankedVariations.rank, 1),
      ),
    )
    .where(
      or(
        isNotNull(rankedVariations.productId),
        and(
          isNull(rankedVariations.productId),
          isNotNull(products.discountedPrice),
        ),
      ),
    )
    .limit(30);
}
