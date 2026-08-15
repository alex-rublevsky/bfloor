import { brands } from "@/db/schema";
import { db } from "@/db";
import { type InferSelectModel } from "drizzle-orm";
export type Brand = Pick<
  InferSelectModel<typeof brands>,
  "slug" | "name" | "image"
>;
export async function getAllBrands(): Promise<Brand[]> {
  return await db.query.brands.findMany();
}
