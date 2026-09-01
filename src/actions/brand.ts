import { z } from "astro/zod";
import { defineAction, ActionError } from "astro:actions";
import { requireAdmin } from "@/lib/api/requireAdmin";
import {
  deleteBrand,
  updateBrand,
  createBrand,
} from "@/db/dashboard/brands/index";
import { generateSlug } from "@/lib/slugGeneration";

export const brand = {
  createBrand: defineAction({
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
      // image: z.string(),
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
      return await createBrand({
        name: cleanName,
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
      id: z.coerce.number().int().positive(),
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
      return await updateBrand({
        name: cleanName,
        slug: input.slug,
        id: input.id,
      });
    },
  }),
};
