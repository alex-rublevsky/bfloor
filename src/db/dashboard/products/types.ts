import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { products } from "@/db/schema";

export type Product = InferSelectModel<typeof products>;

export type ProductWithStoreLocations = Product & {
  storeLocationIds: number[];
};

export type CreateProductInput = Pick<
  InferInsertModel<typeof products>,
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
> & {
  storeLocationIds: number[];
};

export type UpdateProductInput = CreateProductInput & {
  id: Product["id"];
};

export type DeleteProductInput = {
  id: Product["id"];
};
