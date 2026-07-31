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
    // variations: r.many.productVariations(),
    // attributeValues: r.many.productAttributeValues(),
    // storeLocations: r.many.productStoreLocations(),
  },
  categories: {
    // parent: r.one.categories({
    //   from: r.categories.parentId,
    //   to: r.categories.id,
    //   alias: "categoryParent",
    // }),
    // children: r.many.categories({ alias: "categoryParent" }),
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
  // productVariations: {
  //   product: r.one.products({
  //     from: r.productVariations.productId,
  //     to: r.products.id,
  //   }),
  //   attributeValues: r.many.variationAttributeValues(),
  // },
  // productAttributes: {
  //   values: r.many.attributeValues(),
  //   productValues: r.many.productAttributeValues(),
  //   variationValues: r.many.variationAttributeValues(),
  // },
  // attributeValues: {
  //   attribute: r.one.productAttributes({
  //     from: r.attributeValues.attributeId,
  //     to: r.productAttributes.id,
  //   }),
  //   products: r.many.productAttributeValues(),
  //   variations: r.many.variationAttributeValues(),
  // },
  // productAttributeValues: {
  //   product: r.one.products({
  //     from: r.productAttributeValues.productId,
  //     to: r.products.id,
  //   }),
  //   attribute: r.one.productAttributes({
  //     from: r.productAttributeValues.attributeId,
  //     to: r.productAttributes.id,
  //   }),
  //   value: r.one.attributeValues({
  //     from: r.productAttributeValues.valueId,
  //     to: r.attributeValues.id,
  //   }),
  // },
  // variationAttributeValues: {
  //   variation: r.one.productVariations({
  //     from: r.variationAttributeValues.variationId,
  //     to: r.productVariations.id,
  //   }),
  //   attribute: r.one.productAttributes({
  //     from: r.variationAttributeValues.attributeId,
  //     to: r.productAttributes.id,
  //   }),
  //   value: r.one.attributeValues({
  //     from: r.variationAttributeValues.valueId,
  //     to: r.attributeValues.id,
  //   }),
  // },
  // storeLocations: {
  //   products: r.many.productStoreLocations(),
  // },
  // productStoreLocations: {
  //   product: r.one.products({
  //     from: r.productStoreLocations.productId,
  //     to: r.products.id,
  //   }),
  //   storeLocation: r.one.storeLocations({
  //     from: r.productStoreLocations.storeLocationId,
  //     to: r.storeLocations.id,
  //   }),
  // },
}));
