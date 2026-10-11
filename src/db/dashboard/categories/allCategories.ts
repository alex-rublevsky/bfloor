import { db } from "@/db";
import type { Category } from "@/db/schema";

export async function getAllCategories(): Promise<Category[]> {
  return await db.query.categories.findMany();
}
