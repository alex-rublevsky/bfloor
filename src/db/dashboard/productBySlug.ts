import { db } from "@/db/index";
import { products } from "@/db/schema";
import { eq, type InferSelectModel } from "drizzle-orm";

export type Product = Pick<
  InferSelectModel<typeof products>,
  | "isActive"
  | "isFeatured"
  | "slug"
  | "name"
  | "categorySlug"
  | "images"
  | "price"
  | "discountedPrice"
  | "brandSlug"
  | "collectionSlug"
  | "description"
  | "importantNote"
>;

export async function getProductBySlug(slug?: string): Promise<Product> {
  if (!slug) throw new Error("slug is required");

  const row = await db
    .select({
      isActive: products.isActive,
      isFeatured: products.isFeatured,
      slug: products.slug,
      name: products.name,
      categorySlug: products.categorySlug,
      images: products.images,
      price: products.price,
      discountedPrice: products.discountedPrice,
      brandSlug: products.brandSlug,
      collectionSlug: products.collectionSlug,
      description: products.description,
      importantNote: products.importantNote,
    })
    .from(products)
    .where(eq(products.slug, slug))
    .get();

  if (!row) throw new Error("product not found");

  return row;
}
