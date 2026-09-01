import { z } from "astro/zod";
import { defineAction, ActionError } from "astro:actions";
import { requireAdmin } from "@/lib/api/requireAdmin";
import {
  deleteCollection,
  updateCollection,
  createCollection,
} from "@/db/dashboard/brands/index";
import { generateSlug } from "@/lib/slugGeneration";

export const collection = {
  createCollection: defineAction({
    accept: "form",
    input: z.object({
      name: z
        .string("Название обязательно")
        .trim()
        .normalize()
        .nonempty("Название обязательно"),
      slug: z
        .string("Ярлык обязателен")
        .trim()
        .normalize()
        .toLowerCase()
        .nonempty("Ярлык обязателен"),
      brandId: z.coerce.number().int().positive(),
    }),
    handler: async (input, { locals }) => {
      requireAdmin(locals);
      const cleanName = input.name.replace(/\s+/g, " ");
      const slugIsCorrect = input.slug === generateSlug(cleanName);
      if (!slugIsCorrect) {
        throw new ActionError({
          code: "BAD_REQUEST",
          message: "Slug is incorrect",
        });
      }
      //TODO: validate that brand exists

      return await createCollection({
        name: cleanName,
        slug: input.slug,
        brandId: input.brandId,
      });
    },
  }),
  deleteCollection: defineAction({
    accept: "form",
    input: z.object({
      id: z.coerce.number().int().positive(),
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
      name: z
        .string("Название обязательно")
        .trim()
        .normalize()
        .nonempty("Название обязательно"),
      slug: z
        .string("Ярлык обязателен")
        .trim()
        .normalize()
        .toLowerCase()
        .nonempty("Ярлык обязателен"),
      brandId: z.coerce.number().int().positive(),
    }),
    handler: async (input, { locals }) => {
      requireAdmin(locals);
      const cleanName = input.name.replace(/\s+/g, " ");
      const slugIsCorrect = input.slug === generateSlug(cleanName);
      if (!slugIsCorrect) {
        throw new ActionError({
          code: "BAD_REQUEST",
          message: "Slug is incorrect",
        });
      }
      //TODO: validate that brand exists
      return await updateCollection({
        id: input.id,
        name: cleanName,
        slug: input.slug,
        brandId: input.brandId,
      });
    },
  }),
};
