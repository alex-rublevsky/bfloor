import type {
  Brand,
  Category,
  Collection,
  Product,
  StoreLocation,
  Attribute,
  AttributeValue,
  Variation,
} from "@/db/schema";

export type ProductVariationForPicker = {
  id: number;
  price: number;
  discountedPrice: number | null;
  squareMetersPerPack: number | null;
  attributes: { attributeId: number; valueId: number }[];
};

export type VariationPickerLayer = {
  attributeId: number;
  attributeName: string;
  values: { valueId: number; valueName: string }[];
};

export type VariationPickerData = {
  variations: CompactProductVariationForPicker[];
  layers: VariationPickerLayer[];
};

export type CompactProductVariationForPicker = Omit<
  ProductVariationForPicker,
  "attributes"
> & { values: number[] };

export type StorefrontProductCard = Pick<
  Product,
  "slug" | "name" | "price" | "discountedPrice" | "unitOfMeasurement" | "images"
> & {
  hasVariations?: boolean;
};

type StorefrontProductBase = Pick<
  Product,
  | "id"
  | "slug"
  | "name"
  | "categoryId"
  | "brandId"
  | "collectionId"
  | "price"
  | "discountedPrice"
  | "unitOfMeasurement"
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
  hasVariations: boolean;
  thicknessMm?: string;
};

export type StorefrontProductDetails = StorefrontProduct & {
  unitOfMeasurement: Product["unitOfMeasurement"];
  sku: Product["sku"];
  attributes: StorefrontAttribute[];
  variations: CompactProductVariationForPicker[];
  variationLayers: VariationPickerLayer[];
};
