import { db } from "@/db/index";
import { products, productStoreLocations } from "@/db/schema";
import { eq } from "drizzle-orm";
import type {
  DeleteProductInput,
  Product,
} from "@/db/dashboard/products/types";

export async function deleteProduct(
  product: DeleteProductInput,
): Promise<Product | null> {
  const [deletedProduct] = await db
    .delete(products)
    .where(eq(products.id, product.id))
    .returning();

  return deletedProduct ?? null;
}
