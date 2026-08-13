import { db } from "@/db/index";
import { brands, collections, products } from "@/db/schema";
import { eq, type InferSelectModel } from "drizzle-orm";

export type Product = Pick<
  InferSelectModel<typeof products>,
  | "id"
  | "isActive"
  | "slug"
  | "name"
  | "categoryId"
  | "images"
  | "price"
  | "discountedPrice"
  | "brandId"
  | "collectionId"
  | "description"
  | "importantNote"
>;

export async function getProductBySlug(slug?: string): Promise<Product> {
  if (!slug) throw new Error("slug is required");

  const row = await db
    .select({
      id: products.id,
      isActive: products.isActive,
      isFeatured: products.isFeatured,
      slug: products.slug,
      name: products.name,
      categoryId: products.categoryId,
      images: products.images,
      price: products.price,
      //   sql<number | null>`COALESCE(
      //   ${products.price},
      //   (SELECT MIN(${productVariations.price})
      //    FROM ${productVariations}
      //    WHERE ${productVariations.productId} = ${products.id}
      //      AND ${productVariations.isActive} = 1)
      // )`,
      discountedPrice: products.discountedPrice,
      //   sql<number | null>`COALESCE(
      //   ${products.discountedPrice},
      //   (SELECT MIN(${productVariations.discountedPrice})
      //    FROM ${productVariations}
      //    WHERE ${productVariations.productId} = ${products.id}
      //      AND ${productVariations.isActive} = 1
      //      AND ${productVariations.discountedPrice} IS NOT NULL)
      // )`,
      brandId: brands.id,
      collectionId: collections.id,
      description: products.description,
      importantNote: products.importantNote,
    })
    .from(products)
    // .innerJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(brands, eq(products.brandId, brands.id))
    .leftJoin(collections, eq(products.collectionId, collections.id))
    .where(eq(products.slug, slug))
    .get();

  if (!row) throw new Error("product not found");

  return row;
}
