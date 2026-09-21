import type { Brand, Collection, NewBrand, NewCollection } from "@/db/schema";

export type CreateBrandInput = Pick<NewBrand, "slug" | "name">;

export type UpdateBrandInput = CreateBrandInput & {
  id: Brand["id"];
};

export type DeleteBrandInput = {
  id: Brand["id"];
};

export type CreateCollectionInput = Pick<
  NewCollection,
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
