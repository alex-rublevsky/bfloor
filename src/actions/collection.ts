import { z } from "astro/zod";
import { defineAction } from "astro:actions";
import { requireAdmin } from "@/lib/api/requireAdmin";
import { createCollection } from "@/db/dashboard/collections/createCollection";
import { deleteCollection } from "@/db/dashboard/collections/deleteCollection";
import { updateCollection } from "@/db/dashboard/collections/updateCollection";

export const collection = {
  createCollection: defineAction({
    accept: "form",
    input: z.object({
      name: z.string(),
      slug: z.string(),
      brandId: z.coerce.number().int().positive(),
    }),
    handler: async (input, { locals }) => {
      requireAdmin(locals);
      return await createCollection({
        name: input.name,
        slug: input.slug,
        brandId: input.brandId,
      });
    },
  }),
  deleteCollection: defineAction({
    accept: "form",
    input: z.object({
      id: z.number(),
      // image: z.string(),
    }),
    handler: async (input, { locals }) => {
      requireAdmin(locals);
      return await deleteCollection({
        id: input.id,
      });
    },
  }),
  updateCollection: defineAction({
    accept: "form",
    input: z.object({
      id: z.coerce.number().int().positive(),
      name: z.string(),
      slug: z.string(),
      brandId: z.coerce.number().int().positive(),
    }),
    handler: async (input, { locals }) => {
      requireAdmin(locals);
      return await updateCollection({
        id: input.id,
        name: input.name,
        slug: input.slug,
        brandId: input.brandId,
      });
    },
  }),
};
