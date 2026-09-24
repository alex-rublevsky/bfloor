import type { NewProduct, Product, ProductStoreLocation } from "@/db/schema";

type StoreLocationId = ProductStoreLocation["storeLocationId"];

export type ProductWithStoreLocations = Product & {
  storeLocationIds: StoreLocationId[];
};

export type NewProductWithStoreLocations = NewProduct & {
  storeLocationIds: StoreLocationId[];
};

export type FormProduct = Partial<ProductWithStoreLocations>;

export type CreateProductInput = NewProductWithStoreLocations;

export type UpdateProductInput = Partial<Product> & {
  id: Product["id"];
  storeLocationIds: StoreLocationId[];
};

export type DeleteProductInput = {
  id: Product["id"];
};
