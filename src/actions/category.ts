import { z } from "astro/zod";
import { ActionError, defineAction } from "astro:actions";
import { requireAdmin } from "@/lib/api/requireAdmin";
import { createCategory } from "@/db/dashboard/createCategory";
import { deleteCategory } from "@/db/dashboard/deleteCategory";

export const category = {
  createCategory: defineAction({
    accept: "form",
    input: z.object({
      name: z.string(),
      slug: z.string(),
      // image: z.string(),
    }),
    handler: async (input, { locals }) => {
      requireAdmin(locals);
      return await createCategory({
        name: input.name,
        slug: input.slug,
        // image: input.image
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
};
