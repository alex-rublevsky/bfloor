import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { products } from "@/db/schema";

export type Product = InferSelectModel<typeof products>;

export type CreateProductInput = Pick<
  InferInsertModel<typeof products>,
  | "isActive"
  | "slug"
  | "name"
  | "categoryId"
  | "price"
  | "discountedPrice"
  | "description"
  | "importantNote"
>;

export type UpdateProductInput = CreateProductInput & {
  id: Product["id"];
};

export type DeleteProductInput = {
  id: Product["id"];
};
