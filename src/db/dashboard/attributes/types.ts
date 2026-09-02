import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { attributes, attributeValues } from "@/db/schema";

export type Attribute = InferSelectModel<typeof attributes>;

export type AttributeValue = InferSelectModel<typeof attributeValues>;

export type CreateAttributeInput = Pick<
  InferInsertModel<typeof attributes>,
  "name" | "slug"
  // | "isStandardized"
>;

export type UpdateAttributeInput = CreateAttributeInput & {
  id: Attribute["id"];
};

export type DeleteAttributeInput = {
  id: Attribute["id"];
};

export type CreateAttributeValueInput = Pick<
  InferInsertModel<typeof attributeValues>,
  "attributeId" | "name" | "normalizedName" | "slug"
>;

export type UpdateAttributeValueInput = CreateAttributeValueInput & {
  id: AttributeValue["id"];
};

export type DeleteAttributeValueInput = {
  id: AttributeValue["id"];
};

export type AttributeWithValues = Attribute & {
  attributeValues: AttributeValue[];
};
