import { db } from "@/db/index";
import { products } from "@/db/schema";
import { isNotNull, type InferSelectModel } from "drizzle-orm";

export type Product = Pick<
  InferSelectModel<typeof products>,
  "slug" | "name" | "categorySlug" | "images" | "price" | "discountedPrice"
>;

export async function getDiscountedProducts(): Promise<Product[]> {
  return db
    .select({
      slug: products.slug,
      name: products.name,
      categorySlug: products.categorySlug,
      images: products.images,
      price: products.price,
      discountedPrice: products.discountedPrice,
    })
    .from(products)
    .where(isNotNull(products.discountedPrice));
}
