import { z } from "astro/zod";
import { defineAction } from "astro:actions";
import { requireAdmin } from "@/lib/api/requireAdmin";
import { createBrand } from "@/db/dashboard/brands/createBrand";
import { deleteBrand } from "@/db/dashboard/brands/deleteBrand";
import { updateBrand } from "@/db/dashboard/brands/updateBrand";

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
      id: z.coerce.number().int().positive(),
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
      id: z.coerce.number().int().positive(),
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
