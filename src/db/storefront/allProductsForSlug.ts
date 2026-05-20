import { db } from "@/db/index";
import { products } from "@/db/schema";
import { type InferSelectModel } from "drizzle-orm";

type ProductRow = Pick<
  InferSelectModel<typeof products>,
  | "slug"
  | "name"
  | "categorySlug"
  | "images"
  | "price"
  | "discountedPrice"
  | "description"
  | "brandSlug"
  | "collectionSlug"
  | "storeLocationId"
>;

export type Product = Omit<ProductRow, "images"> & {
  images: string[];
};

function normalizeImages(images: ProductRow["images"]): string[] {
  const list = images ?? [];
  return list.filter((x): x is string => typeof x === "string");
}

export async function getAllProductsForSlug(): Promise<Product[]> {
  const rows = await db
    .select({
      slug: products.slug,
      name: products.name,
      categorySlug: products.categorySlug,
      images: products.images,
      price: products.price,
      discountedPrice: products.discountedPrice,
      description: products.description,
      brandSlug: products.brandSlug,
      collectionSlug: products.collectionSlug,
      storeLocationId: products.storeLocationId,
    })
    .from(products);

  return rows.map((row) => ({
    ...row,
    images: normalizeImages(row.images),
  }));
}
