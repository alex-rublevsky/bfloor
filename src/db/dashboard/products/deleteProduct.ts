import { db } from "@/db/index";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { DeleteProductInput } from "@/db/dashboard/products/types";
import type { Product } from "@/db/schema";

export async function deleteProduct(
  product: DeleteProductInput,
): Promise<Product | null> {
  const [deletedProduct] = await db
    .delete(products)
    .where(eq(products.id, product.id))
    .returning();

  return deletedProduct ?? null;
}
