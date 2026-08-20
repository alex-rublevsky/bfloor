import { z } from "astro/zod";
import { defineAction } from "astro:actions";
import { requireAdmin } from "@/lib/api/requireAdmin";
import {
  deleteAttribute,
  updateAttribute,
  createAttribute,
} from "@/db/dashboard/attributes/index";

export const attribute = {
  createAttribute: defineAction({
    accept: "form",
    input: z.object({
      name: z.string(),
      slug: z.string(),
    }),
    handler: async (input, { locals }) => {
      requireAdmin(locals);
      return await createAttribute({
        name: input.name,
        slug: input.slug,
      });
    },
  }),
  deleteAttribute: defineAction({
    accept: "form",
    input: z.object({
      id: z.coerce.number().int().positive(),
      // image: z.string(),
    }),
    handler: async (input, { locals }) => {
      requireAdmin(locals);
      return await deleteAttribute({
        id: input.id,
      });
    },
  }),
  updateAttribute: defineAction({
    accept: "form",
    input: z.object({
      name: z.string(),
      slug: z.string(),
      id: z.coerce.number().int().positive(),
    }),
    handler: async (input, { locals }) => {
      requireAdmin(locals);
      return await updateAttribute({
        name: input.name,
        slug: input.slug,
        id: input.id,
      });
    },
  }),
};
