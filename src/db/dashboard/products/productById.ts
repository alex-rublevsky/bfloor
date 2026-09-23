import { db } from "@/db/index";
import { type Product } from "@/db/schema";

export async function getProductById(id: number): Promise<Product | null> {
  if (!id) return null;

  const row = await db.query.products.findFirst({
    where: { id: id },
  });

  return row ?? null;
}
