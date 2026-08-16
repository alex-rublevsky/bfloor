import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { categories } from "@/db/schema";

export type Category = InferSelectModel<typeof categories>;

export type CreateCategoryInput = Pick<
  InferInsertModel<typeof categories>,
  "name" | "slug"
>;

export type UpdateCategoryInput = CreateCategoryInput & {
  id: Category["id"];
};

export type DeleteCategoryInput = {
  id: Category["id"];
};
