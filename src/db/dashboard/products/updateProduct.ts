import { db } from "@/db/index";
import { products, productStoreLocations } from "@/db/schema";
import { eq } from "drizzle-orm";
import type {
  UpdateProductInput,
  ProductWithStoreLocations,
} from "@/db/dashboard/products/types";

export async function updateProduct(
  product: UpdateProductInput,
): Promise<ProductWithStoreLocations> {
  return await db.transaction(async (tx) => {
    const [updatedProduct] = await tx
      .update(products)
      .set({
        isActive: product.isActive,
        slug: product.slug,
        name: product.name,
        images: product.images,
        categoryId: product.categoryId,
        brandId: product.brandId,
        collectionId: product.collectionId,
        price: product.price,
        discountedPrice: product.discountedPrice,
        description: product.description,
        importantNote: product.importantNote,
      })
      .where(eq(products.id, product.id))
      .returning();

    if (!updatedProduct) {
      throw new Error("Product was not found");
    }

    await tx
      .delete(productStoreLocations)
      .where(eq(productStoreLocations.productId, product.id));

    const locationRows = product.storeLocationIds.map((storeLocationId) => ({
      productId: product.id,
      storeLocationId,
    }));

    if (locationRows.length > 0) {
      await tx.insert(productStoreLocations).values(locationRows);
    }

    return {
      ...updatedProduct,
      storeLocationIds: product.storeLocationIds,
    };
  });
}
