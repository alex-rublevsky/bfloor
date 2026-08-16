import { z } from "astro/zod";
import { defineAction } from "astro:actions";
import { requireAdmin } from "@/lib/api/requireAdmin";
import { createCategory } from "@/db/dashboard/categories/createCategory";
import { deleteCategory } from "@/db/dashboard/categories/deleteCategory";
import { updateCategory } from "@/db/dashboard/categories/updateCategory";

export const category = {
  createCategory: defineAction({
    accept: "form",
    input: z.object({
      name: z.string(),
      slug: z.string(),
      // image: z.instanceof(File),
    }),
    handler: async (input, { locals }) => {
      requireAdmin(locals);
      return await createCategory({
        name: input.name,
        slug: input.slug,
        // image: input.image,
      });
    },
  }),
  deleteCategory: defineAction({
    accept: "form",
    input: z.object({
      id: z.number(),
      // image: z.string(),
    }),
    handler: async (input, { locals }) => {
      requireAdmin(locals);
      return await deleteCategory({
        id: input.id,
      });
    },
  }),
  updateCategory: defineAction({
    accept: "form",
    input: z.object({
      name: z.string(),
      slug: z.string(),
      id: z.number(),
    }),
    handler: async (input, { locals }) => {
      requireAdmin(locals);
      return await updateCategory({
        name: input.name,
        slug: input.slug,
        id: input.id,
      });
    },
  }),
};
