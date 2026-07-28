import { db } from "@/db";

export type StorefrontProduct = {
  id: number;
  slug: string;
  name: string;
  description: string;
  images: string[];
  category: { name: string; slug: string };
};

export async function getProductsForSlugPages() {
  return await db.query.products.findMany({
    // columns: {},
    where: { isActive: true },
    with: {
      category: { columns: { name: true, slug: true } },
      // variations: { orderBy: { weight: "desc" } },
    },
  });
}
