import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { brands } from "@/db/schema";

export type Brand = InferSelectModel<typeof brands>;

export type CreateBrandInput = Pick<
  InferInsertModel<typeof brands>,
  "slug" | "name"
>;

export type UpdateBrandInput = CreateBrandInput & {
  id: Brand["id"];
};

export type DeleteBrandInput = {
  id: Brand["id"];
};
