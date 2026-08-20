import { db } from "@/db";
import type { Attribute } from "./types";

export async function getAllAttributes(): Promise<Attribute[]> {
  return await db.query.attributes.findMany();
}
