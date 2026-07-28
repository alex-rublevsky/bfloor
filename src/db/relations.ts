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
  },
  categories: {
    products: r.many.products(),
  },
  brands: {
    // category: r.one.categories({
    //   from: r.brands.categoryId,
    //   to: r.categories.id,
    // }),
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
}));
