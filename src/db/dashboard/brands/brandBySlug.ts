import { db } from "@/db/index";
import type { Brand } from "@/db/dashboard/brands/types";

export async function getBrandBySlug(slug?: string): Promise<Brand | null> {
  if (!slug) throw new Error("slug is required");

  const row = await db.query.brands.findFirst({
    where: {
      slug: slug,
    },
  });

  return row ?? null;
}
