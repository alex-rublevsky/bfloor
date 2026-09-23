import { db } from "@/db";
import type { Brand } from "@/db/schema";

export async function getAllBrands(): Promise<Brand[]> {
  return await db.query.brands.findMany();
}
