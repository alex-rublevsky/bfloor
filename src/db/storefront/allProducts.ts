import { db } from "@/db/index";
import { eq } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import { products } from "@/db/schema";

type ProductRow = Pick<
  InferSelectModel<typeof products>,
  "id" | "slug" | "name" | "categorySlug" | "images" | "price"
>;

export type Product = Omit<ProductRow, "images"> & {
  images: string[];
};

function normalizeImages(images: ProductRow["images"]): string[] {
  const list = images ?? [];
  return list.filter((x): x is string => typeof x === "string");
}

export async function getProductsByCategory(
  category: string,
): Promise<Product[]> {
  const rows = await db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      categorySlug: products.categorySlug,
      images: products.images,
      price: products.price,
    })
    .from(products)
    .where(eq(products.categorySlug, category));

  return rows.map((row) => ({
    ...row,
    images: normalizeImages(row.images),
  }));
}
