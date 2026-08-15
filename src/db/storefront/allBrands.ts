import { db } from "@/db";

export async function getAllBrands() {
  return await db.query.brands.findMany();
}
