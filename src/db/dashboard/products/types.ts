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

export type FormProduct = Partial<
  Pick<
    Product,
    | "id"
    | "isActive"
    | "name"
    | "slug"
    | "images"
    | "price"
    | "discountedPrice"
    | "categoryId"
    | "brandId"
    | "collectionId"
    | "unitOfMeasurement"
    | "squareMetersPerPack"
    | "description"
    | "importantNote"
  >
> & {
  storeLocationIds?: ProductStoreLocation["storeLocationId"][];
};

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
