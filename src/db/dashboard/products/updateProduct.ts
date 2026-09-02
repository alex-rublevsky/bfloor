import { db } from "@/db/index";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";
import type {
  UpdateProductInput,
  Product,
} from "@/db/dashboard/products/types";

export async function updateProduct(
  product: UpdateProductInput,
): Promise<Product> {
  const insertProduct = await db
    .update(products)
    .set({
      isActive: product.isActive,
      slug: product.slug,
      name: product.name,
      categoryId: product.categoryId,
      brandId: product.brandId,
      collectionId: product.collectionId,
      price: product.price,
      discountedPrice: product.discountedPrice,
      description: product.description,
      importantNote: product.importantNote,
      // images: product.images,
    })
    .where(eq(products.id, product.id))
    .returning()
    .then((res) => res[0]);

  return insertProduct;
}
