import type { NewProduct, Product, ProductStoreLocation } from "@/db/schema";

type ProductMutationFields = Pick<
  NewProduct,
  | "isActive"
  | "slug"
  | "name"
  | "categoryId"
  | "brandId"
  | "collectionId"
  | "price"
  | "discountedPrice"
  | "description"
  | "importantNote"
  | "images"
>;

type StoreLocationId = ProductStoreLocation["storeLocationId"];

//TODO: what is the difference between Partial<> and InferInsertModel?
export type CreateProductInput = ProductMutationFields & {
  storeLocationIds: StoreLocationId[];
};

export type UpdateProductInput = ProductMutationFields & {
  id: Product["id"];
  storeLocationIds: StoreLocationId[];
};

export type DeleteProductInput = {
  id: Product["id"];
};
