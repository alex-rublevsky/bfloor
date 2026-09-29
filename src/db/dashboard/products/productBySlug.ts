import { db } from "@/db/index";
import type { ProductFormData } from "@/db/dashboard/products/types";

export async function getProductBySlug(
  slug?: string,
): Promise<ProductFormData | null> {
  if (!slug) throw new Error("slug is required");

  const row = await db.query.products.findFirst({
    where: {
      slug: slug,
    },
    with: {
      productAttributeValues: {
        with: {
          attribute: true,
          attributeValue: true,
        },
      },
      productStoreLocations: {
        columns: {
          storeLocationId: true,
        },
      },
    },
  });
  if (!row) return null;

  return {
    ...row,
    storeLocationIds: row.productStoreLocations.map(
      ({ storeLocationId }) => storeLocationId,
    ),
    attributeValueIds: row.productAttributeValues.map(
      ({ attributeValueId }) => attributeValueId,
    ),
  };
}
