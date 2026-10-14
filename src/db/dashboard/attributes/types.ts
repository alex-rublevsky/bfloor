import type {
  Attribute,
  AttributeValue,
  NewAttribute,
  NewAttributeValue,
} from "@/db/schema";

export type CreateAttributeInput = Pick<NewAttribute, "name" | "slug">;

export type UpdateAttributeInput = CreateAttributeInput & {
  id: Attribute["id"];
};

export type DeleteAttributeInput = {
  id: Attribute["id"];
};

export type CreateAttributeValueInput = Pick<
  NewAttributeValue,
  "attributeId" | "name" | "normalizedName" | "slug"
>;

export type UpdateAttributeValueInput = Omit<
  CreateAttributeValueInput,
  "attributeId"
> & {
  id: AttributeValue["id"];
};

export type DeleteAttributeValueInput = {
  id: AttributeValue["id"];
};

export type AttributeWithValues = Attribute & {
  attributeValues: AttributeValue[];
};
