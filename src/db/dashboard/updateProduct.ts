import { db } from "@/db/index";
import { products } from "@/db/schema";
import { eq, type InferSelectModel } from "drizzle-orm";

export type Product = Pick<
  InferSelectModel<typeof products>,
  | "id"
  | "isActive"
  | "isFeatured"
  | "slug"
  | "name"
  | "price"
  | "discountedPrice"
  | "categoryId"
  | "description"
  | "importantNote"
>;

export async function updateProduct(product: Product) {
  const insertProduct = await db
    .update(products)
    .set({
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
    .where(eq(products.id, product.id))
    .returning()
    .then((res) => res[0]);

  return insertProduct;
}
