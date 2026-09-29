import type {
  NewProduct,
  Product,
  ProductStoreLocation,
  AttributeValue,
  Attribute,
} from "@/db/schema";

type StoreLocationId = ProductStoreLocation["storeLocationId"];

export type AttributeSelection = {
  attributeId: Attribute["id"];
  attributeValueId: AttributeValue["id"];
};

export type ProductFormData = Partial<Product> & {
  storeLocationIds?: StoreLocationId[];
  attributeValueIds?: AttributeValue["id"][];
};

type ProductRelations = {
  storeLocationIds: StoreLocationId[];
  productAttributeValues: AttributeSelection[];
};

export type ProductWithRelations = Product & ProductRelations;

export type CreateProductInput = NewProduct & ProductRelations;

export type UpdateProductInput = Partial<Product> & {
  id: Product["id"];
} & ProductRelations;

export type DeleteProductInput = {
  id: Product["id"];
};
