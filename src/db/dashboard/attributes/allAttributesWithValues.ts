import { db } from "@/db";
import type { AttributeWithValues } from "./types";

export async function getAllAttributesWithValues(): Promise<
  AttributeWithValues[]
> {
  return await db.query.attributes.findMany({
    orderBy: (attributes, { asc }) => asc(attributes.name),
    with: {
      attributeValues: {
        orderBy: (attributeValues, { asc }) => asc(attributeValues.name),
      },
    },
  });
}
