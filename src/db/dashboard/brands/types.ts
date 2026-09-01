import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { brands, collections } from "@/db/schema";

export type Brand = InferSelectModel<typeof brands>;

export type CreateBrandInput = Pick<
  InferInsertModel<typeof brands>,
  "slug" | "name"
>;

export type UpdateBrandInput = CreateBrandInput & {
  id: Brand["id"];
};

export type DeleteBrandInput = {
  id: Brand["id"];
};

export type Collection = InferSelectModel<typeof collections>;

export type CreateCollectionInput = Pick<
  InferInsertModel<typeof collections>,
  "slug" | "name" | "brandId"
>;
export type UpdateCollectionInput = CreateCollectionInput & {
  id: Collection["id"];
};

export type DeleteCollectionInput = {
  id: Collection["id"];
};

export type BrandWithCollections = Brand & {
  collections: Collection[];
};
