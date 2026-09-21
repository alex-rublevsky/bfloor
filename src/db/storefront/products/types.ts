import type {
  Brand,
  Category,
  Collection,
  Product,
  ProductStoreLocation,
} from "@/db/schema";

//TODO: what is the difference between Partial<> and IfnerInsertModel?
type StorefrontProductBase = Pick<
  Product,
  // | "id"
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
  | "updatedAt"
>;

type CategorySummary = Pick<Category, "name" | "slug">;
type BrandSummary = Pick<Brand, "name" | "slug" | "image">;
type CollectionSummary = Pick<Collection, "name" | "slug">;

export type StorefrontProduct = StorefrontProductBase & {
  category: CategorySummary;
  brand: BrandSummary | null;
  collection: CollectionSummary | null;
  productStoreLocations: Pick<ProductStoreLocation, "storeLocationId">[];
};
