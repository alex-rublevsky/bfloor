import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
  products: {
    category: r.one.categories({
      from: r.products.categoryId,
      to: r.categories.id,
    }),
    brand: r.one.brands({
      from: r.products.brandId,
      to: r.brands.id,
    }),
    collection: r.one.collections({
      from: r.products.collectionId,
      to: r.collections.id,
    }),
    productAttributeValues: r.many.productAttributeValues(),
    variations: r.many.variations(),
    productStoreLocations: r.many.productStoreLocations(),
  },
  productStoreLocations: {
    products: r.many.products({
      from: r.productStoreLocations.productId,
      to: r.products.id,
    }),
  },
  categories: {
    products: r.many.products(),
  },
  brands: {
    collections: r.many.collections(),
    products: r.many.products(),
  },
  collections: {
    brand: r.one.brands({
      from: r.collections.brandId,
      to: r.brands.id,
    }),
    products: r.many.products(),
  },
  attributes: {
    attributeValues: r.many.attributeValues(),
    productValues: r.many.productAttributeValues(),
    variationValues: r.many.variationAttributeValues(),
  },
  attributeValues: {
    attribute: r.one.attributes({
      from: r.attributeValues.attributeId,
      to: r.attributes.id,
    }),
    productAttributeValues: r.many.productAttributeValues(),
    variationAttributeValues: r.many.variationAttributeValues(),
  },
  productAttributeValues: {
    product: r.one.products({
      from: r.productAttributeValues.productId,
      to: r.products.id,
    }),
    attribute: r.one.attributes({
      from: r.productAttributeValues.attributeId,
      to: r.attributes.id,
    }),
    //is this below needed? should it be optional? how to make it such?
    attributeValue: r.one.attributeValues({
      from: r.productAttributeValues.attributeValueId,
      to: r.attributeValues.id,
    }),
  },
  variations: {
    product: r.one.products({
      from: r.variations.productId,
      to: r.products.id,
    }),
    variationAttributeValues: r.many.variationAttributeValues(),
  },
  variationAttributeValues: {
    variation: r.one.variations({
      from: r.variationAttributeValues.variationId,
      to: r.variations.id,
    }),
    attribute: r.one.attributes({
      from: r.variationAttributeValues.attributeId,
      to: r.attributes.id,
    }),
    //is this below needed? should it be optional? how to make it such?
    attributeValue: r.one.attributeValues({
      from: r.variationAttributeValues.attributeValueId,
      to: r.attributeValues.id,
    }),
  },
}));
