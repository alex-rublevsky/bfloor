import { categories } from "@/db/schema";
import { db } from "@/db/index";

export type Category = {
  id: number;
  slug: string;
  name: string;
};

export async function getAllCategories() {
  return db.select().from(categories).all();
}
