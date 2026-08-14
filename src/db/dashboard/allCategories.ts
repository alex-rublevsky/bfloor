import { categories } from "@/db/schema";
import { db } from "@/db";
import { type InferSelectModel } from "drizzle-orm";
export type Category = Pick<
  InferSelectModel<typeof categories>,
  "slug" | "name" | "image"
>;
export async function getAllCategories(): Promise<Category[]> {
  return await db.query.categories.findMany();
}
