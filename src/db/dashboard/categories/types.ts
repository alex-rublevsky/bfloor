import type { Category, NewCategory } from "@/db/schema";

export type CreateCategoryInput = Pick<
  NewCategory,
  "name" | "slug" | "description"
>;

export type UpdateCategoryInput = CreateCategoryInput & {
  id: Category["id"];
};

export type DeleteCategoryInput = {
  id: Category["id"];
};
