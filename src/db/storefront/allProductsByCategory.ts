import { db } from "@/db/index";
import { eq, type InferSelectModel } from "drizzle-orm";
import { products } from "@/db/schema";

// export type Product = {
//   slug: string;
//   name: string;
//   categorySlug: string;
//   images: string[];
//   price: number | null;
//   discountedPrice: number | null;
// };

export type Product = Pick<InferSelectModel<typeof products>, "slug" | "name">;

export async function getProductsByCategory(
  categoryId?: number,
  page?: number,
): Promise<Product[] | null> {
  if (!categoryId) return null;
  const pageSize = 50;
  const offset = page ? (page - 1) * pageSize : 0;

  return db
    .select({
      name: products.name,
      slug: products.slug,
    })
    .from(products)
    .where(eq(products.categoryId, categoryId))
    .orderBy(products.viewCount)
    .limit(pageSize)
    .offset(offset);
}
