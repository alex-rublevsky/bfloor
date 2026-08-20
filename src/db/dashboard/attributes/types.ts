import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { attributes } from "@/db/schema";

export type Attribute = InferSelectModel<typeof attributes>;

export type CreateAttributeInput = Pick<
  InferInsertModel<typeof attributes>,
  "name" | "slug" | "standardizedOptions"
>;

export type UpdateAttributeInput = CreateAttributeInput & {
  id: Attribute["id"];
};

export type DeleteAttributeInput = {
  id: Attribute["id"];
};
