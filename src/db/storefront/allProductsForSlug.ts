import { db } from "@/db/index";
import { brands, categories, collections, products } from "@/db/schema";
import { eq, sql, type InferSelectModel } from "drizzle-orm";

// export type Product = {
//   slug: string;
//   name: string;
//   categorySlug: string;
//   images: string[];
//   price: number | null;
//   discountedPrice: number | null;
//   description: string | null;
//   brandSlug: string | null;
//   collectionSlug: string | null;
// };

export type Product = {
  name: string;
  slug: string;
  images: string[];
  categorySlug: string;
  categoryName: string;
  price: number | null;
  discountedPrice: number | null;
  description: string | null;
  brandSlug: string | null;
  brandName: string | null;
  collectionSlug: string | null;
  collectionName: string | null;
};

export async function getAllProductsForSlug(): Promise<Product[]> {
  return db
    .select({
      slug: products.slug,
      name: products.name,
      categorySlug: categories.slug,
      categoryName: categories.name,
      images: products.images,
      price: products.price,
      discountedPrice: products.discountedPrice,
      description: products.description,
      brandSlug: brands.slug,
      brandName: brands.name,
      collectionSlug: collections.slug,
      collectionName: collections.name,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(brands, eq(products.brandId, brands.id))
    .leftJoin(collections, eq(products.collectionId, collections.id));
}
