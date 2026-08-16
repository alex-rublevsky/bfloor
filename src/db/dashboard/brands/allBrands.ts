import { db } from "@/db";
import type { Brand } from "@/db/dashboard/brands/types";
export async function getAllBrands(): Promise<Brand[]> {
  return await db.query.brands.findMany();
}
