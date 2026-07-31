import { db } from "@/db/index";
import { products } from "@/db/schema";
import { type InferSelectModel } from "drizzle-orm";

export type Product = Pick<
  InferSelectModel<typeof products>,
  | "isActive"
  | "isFeatured"
  | "slug"
  | "name"
  | "price"
  | "discountedPrice"
  | "description"
  | "importantNote"
  | "categoryId"
>;

export async function createProduct(product: Product): Promise<Product> {
  const insertProduct = await db
    .insert(products)
    .values({
      isActive: product.isActive,
      isFeatured: product.isFeatured,
      slug: product.slug,
      name: product.name,
      categoryId: product.categoryId,
      price: product.price,
      discountedPrice: product.discountedPrice,
      description: product.description,
      importantNote: product.importantNote,
    })
    .returning()
    .then((res) => res[0]);

  return { ...insertProduct };
}
