import { db } from "@/db";
import { sql } from "drizzle-orm";
import type {
  StorefrontProductDetails,
  StorefrontAttribute,
  VariationPickerLayer,
} from "./types";

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
        orderBy: (variation, { asc }) => [
          asc(sql`coalesce(${variation.discountedPrice}, ${variation.price})`),
          asc(variation.id),
        ],
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

    const layerMap = new Map<number, VariationPickerLayer>();
    for (const variation of product.variations) {
      for (const item of variation.variationAttributeValues) {
        let layer = layerMap.get(item.attributeId);
        if (!layer) {
          layer = {
            attributeId: item.attributeId,
            attributeName: item.attribute.name,
            values: [],
          };
          layerMap.set(item.attributeId, layer);
        }
        if (
          !layer.values.some((value) => value.valueId === item.attributeValueId)
        ) {
          layer.values.push({
            valueId: item.attributeValueId,
            valueName: item.attributeValue.name,
          });
        }
      }
    }

    const variationLayers = [...layerMap.values()]
      .map((layer) => ({
        ...layer,
        values: layer.values.sort((a, b) => a.valueId - b.valueId),
      }))
      .sort((a, b) => a.attributeId - b.attributeId);
    const variations = product.variations.map((variation) => ({
      id: variation.id,
      price: variation.price,
      discountedPrice: variation.discountedPrice,
      squareMetersPerPack: variation.squareMetersPerPack,
      values: variationLayers.flatMap((layer) => {
        const value = variation.variationAttributeValues.find(
          (item) => item.attributeId === layer.attributeId,
        );
        return value ? [value.attributeValueId] : [];
      }),
    }));

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
      variations,
      variationLayers,
      hasVariations: product.variations.length > 0,

      storeLocations: product.storeLocations.map(
        ({ storeLocationId }) => storeLocationId,
      ),

      attributes,
    };
  });
}
