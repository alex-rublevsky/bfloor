import { db } from "@/db";
import type { StorefrontProductDetails, StorefrontAttribute } from "./types";

export async function getProductsForSlugPages(): Promise<
  StorefrontProductDetails[]
> {
  const products = await db.query.products.findMany({
    where: { isActive: true },
    with: {
      variations: {
        columns: {
          id: true,
          price: true,
          discountedPrice: true,
          squareMetersPerPack: true,
        },
        with: {
          variationAttributeValues: {
            columns: { attributeValueId: true, attributeId: true },
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
        },
      },
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
      id: product.id,
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
      unitOfMeasurement: product.unitOfMeasurement,
      sku: product.sku,
      category: product.category,
      brand: product.brand,
      collection: product.collection,
      variations: product.variations,
      hasVariations: product.variations.length > 0,

      storeLocations: product.storeLocations.map(
        ({ storeLocationId }) => storeLocationId,
      ),

      attributes,
    };
  });
}
