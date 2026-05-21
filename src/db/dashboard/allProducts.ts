import { db } from "@/db/index";
import { products } from "@/db/schema";
import { asc, type InferSelectModel } from "drizzle-orm";

export type Product = Pick<
  InferSelectModel<typeof products>,
  "slug" | "name" | "categorySlug" | "images" | "price" | "discountedPrice"
>;

export async function getAllProducts(page: number): Promise<Product[]> {
  const offset = (page - 1) * 50;
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
    .orderBy(asc(products.name))
    .limit(50)
    .offset(offset);
}
