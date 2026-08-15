import { db } from "@/db/index";
import { brands } from "@/db/schema";
import { type InferSelectModel } from "drizzle-orm";

export type Brand = Pick<
  InferSelectModel<typeof brands>,
  "id" | "name" | "image" | "slug"
>;

export async function getBrandBySlug(slug?: string): Promise<Brand | null> {
  if (!slug) throw new Error("slug is required");

  const row = await db.query.brands.findFirst({
    where: {
      slug: slug,
    },
  });

  return row ?? null;
}
