import { db } from "@/db";
import type { Attribute } from "@/db/schema";

export async function getAllAttributes(): Promise<Attribute[]> {
  return await db.query.attributes.findMany({
    orderBy: (attributes, { asc }) => asc(attributes.name),
  });
}
