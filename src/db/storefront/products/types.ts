import type {
  Brand,
  Category,
  Collection,
  Product,
  StoreLocation,
  Attribute,
  AttributeValue,
} from "@/db/schema";

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
type BrandSummary = Pick<Brand, "name" | "slug" | "image" | "countryId">;
type CollectionSummary = Pick<Collection, "name" | "slug">;
type StoreLocationId = StoreLocation["storeLocationId"];

export type StorefrontAttribute = {
  name: Attribute["name"];
  values: {
    name: AttributeValue["name"];
  }[];
};

export type StorefrontProduct = StorefrontProductBase & {
  category: CategorySummary;
  brand?: BrandSummary | null;
  collection?: CollectionSummary | null;
  storeLocations: StoreLocationId[];
};

export type StorefrontProductDetails = StorefrontProduct & {
  attributes: StorefrontAttribute[];
};
