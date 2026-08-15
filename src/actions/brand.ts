import { z } from "astro/zod";
import { defineAction } from "astro:actions";
import { requireAdmin } from "@/lib/api/requireAdmin";
import { createBrand } from "@/db/dashboard/createBrand";
import { deleteBrand } from "@/db/dashboard/deleteBrand";
import { updateBrand } from "@/db/dashboard/updateBrand";

export const brand = {
  createBrand: defineAction({
    accept: "form",
    input: z.object({
      name: z.string(),
      slug: z.string(),
      // image: z.string(),
    }),
    handler: async (input, { locals }) => {
      requireAdmin(locals);
      return await createBrand({
        name: input.name,
        slug: input.slug,
        // image: input.image
      });
    },
  }),
  deleteBrand: defineAction({
    accept: "form",
    input: z.object({
      id: z.number(),
      // image: z.string(),
    }),
    handler: async (input, { locals }) => {
      requireAdmin(locals);
      return await deleteBrand({
        id: input.id,
      });
    },
  }),
  updateBrand: defineAction({
    accept: "form",
    input: z.object({
      name: z.string(),
      slug: z.string(),
      id: z.number(),
    }),
    handler: async (input, { locals }) => {
      requireAdmin(locals);
      return await updateBrand({
        name: input.name,
        slug: input.slug,
        id: input.id,
      });
    },
  }),
};
