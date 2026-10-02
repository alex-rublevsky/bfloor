import { db } from "@/db";
import type { StorefrontProduct, StorefrontAttribute } from "./types";

export async function getProductsForSlugPages(): Promise<StorefrontProduct[]> {
  const products = await db.query.products.findMany({
    where: { isActive: true },
    with: {
      category: { columns: { name: true, slug: true } },
      brand: {
        columns: { name: true, slug: true, image: true, countryId: true },
      },
      collection: { columns: { name: true, slug: true } },
      storeLocations: { columns: { storeLocationId: true } },
      productAttributeValues: {
        columns: {
          attributeId: true,
          attributeValueId: true,
        },
        with: {
          attribute: {
            columns: {
              name: true,
            },
          },
          attributeValue: {
            columns: {
              name: true,
            },
          },
        },
      },
      // variations: { orderBy: { weight: "desc" } },
    },
  });

  return products.map((product) => {
    const attributes = product.productAttributeValues.reduce<
      StorefrontAttribute[]
    >((groups, row) => {
      let group = groups.find(
        (attribute) => attribute.name === row.attribute.name,
      );

      if (!group) {
        group = {
          name: row.attribute.name,
          values: [],
        };

        groups.push(group);
      }

      group.values.push({
        name: row.attributeValue.name,
      });

      return groups;
    }, []);

    return {
      slug: product.slug,
      name: product.name,
      categoryId: product.categoryId,
      brandId: product.brandId,
      collectionId: product.collectionId,
      price: product.price,
      discountedPrice: product.discountedPrice,
      description: product.description,
      importantNote: product.importantNote,
      images: product.images,
      updatedAt: product.updatedAt,

      category: product.category,
      brand: product.brand,
      collection: product.collection,

      storeLocations: product.storeLocations.map(
        ({ storeLocationId }) => storeLocationId,
      ),

      attributes,
    };
  });
}
