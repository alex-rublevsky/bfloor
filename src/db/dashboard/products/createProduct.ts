import { db } from "@/db/index";
import { products } from "@/db/schema";
import type {
  CreateProductInput,
  Product,
} from "@/db/dashboard/products/types";

export async function createProduct(
  product: CreateProductInput,
): Promise<Product> {
  const insertedProduct = await db
    .insert(products)
    .values({
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
      storeLocationIds: product.storeLocationIds,
    })
    .returning()
    .then((res) => res[0]);

  return { ...insertedProduct };
}
