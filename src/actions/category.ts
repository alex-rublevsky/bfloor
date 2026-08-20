import { z } from "astro/zod";
import { defineAction } from "astro:actions";
import { requireAdmin } from "@/lib/api/requireAdmin";
import {
  deleteCategory,
  updateCategory,
  createCategory,
} from "@/db/dashboard/categories/index";

export const category = {
  createCategory: defineAction({
    accept: "form",
    input: z.object({
      name: z.string(),
      slug: z.string(),
      description: z.string(),
      // image: z.instanceof(File),
    }),
    handler: async (input, { locals }) => {
      requireAdmin(locals);
      return await createCategory({
        name: input.name,
        slug: input.slug,
        description: input.description,
        // image: input.image,
      });
    },
  }),
  deleteCategory: defineAction({
    accept: "form",
    input: z.object({
      id: z.coerce.number().int().positive(),
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
      description: z.string(),
      id: z.coerce.number().int().positive(),
    }),
    handler: async (input, { locals }) => {
      requireAdmin(locals);
      return await updateCategory({
        name: input.name,
        slug: input.slug,
        description: input.description,
        id: input.id,
      });
    },
  }),
};
