import { z } from "astro/zod";
import { defineAction, ActionError } from "astro:actions";
import { requireAdmin } from "@/lib/api/requireAdmin";
import {
  deleteAttributeValue,
  updateAttributeValue,
  createAttributeValue,
} from "@/db/dashboard/attributes/index";
import { generateSlug } from "@/lib/slugGeneration";

export const attributeValue = {
  createAttributeValue: defineAction({
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
      //TODO: is this correct? how would this handle 0/null? is it appropriate to use coerce.number() here?
      attributeId: z.coerce.number().int().positive("ID атрибута обязателен"),
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

      //TODO: validate uniqueness
      return await createAttributeValue({
        name: cleanName,
        normalizedName: input.name.toLowerCase(),
        slug: input.slug,
        attributeId: input.attributeId,
      });
    },
  }),
  deleteAttributeValue: defineAction({
    accept: "form",
    input: z.object({
      id: z.coerce.number().int().positive(),
    }),
    handler: async (input, { locals }) => {
      requireAdmin(locals);
      return await deleteAttributeValue({
        id: input.id,
      });
    },
  }),
  updateAttributeValue: defineAction({
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
      attributeId: z.coerce.number().int().positive("ID атрибута обязателен"),
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

      return await updateAttributeValue({
        id: input.id,
        name: cleanName,
        slug: input.slug,
        normalizedName: input.name.toLowerCase(),
        attributeId: input.attributeId,
      });
    },
  }),
};
