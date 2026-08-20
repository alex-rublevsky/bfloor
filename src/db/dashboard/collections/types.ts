import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { collections } from "@/db/schema";
import type { Brand } from "@/db/dashboard/brands";

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
