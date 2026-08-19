import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { products } from "@/db/schema";

export type Product = Pick<
  InferSelectModel<typeof products>,
  | "price"
  | "name"
  | "images"
  | "description"
  | "importantNote"
  | "brandId"
  | "collectionId"
  | "discountedPrice"
  | "unitOfMeasurement"
  | "storeLocationId"
  | "isActive"
  | "categoryId"
  | "sku"
  | "slug"
>;
