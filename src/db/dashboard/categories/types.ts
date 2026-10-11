import type { Category, NewCategory } from "@/db/schema";

export type UpdateCategoryInput = NewCategory & {
  id: Category["id"];
};

export type DeleteCategoryInput = {
  id: Category["id"];
};
