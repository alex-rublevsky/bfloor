import { z } from "astro/zod";
import { defineAction, ActionError } from "astro:actions";
import { requireAdmin } from "@/lib/api/requireAdmin";
import {
  deleteBrand,
  updateBrand,
  createBrand,
} from "@/db/dashboard/brands/index";
import { generateSlug } from "@/lib/slugGeneration";
import { COUNTRIES } from "@/lib/countries";

const countryId = z.preprocess(
  (value) => (value === "" || value == null ? null : Number(value)),
  z
    .number("Ошибка со страной")
    .int("Ошибка со страной")
    .refine(
      (value) => COUNTRIES.some((country) => country.id === value),
      "Ошибка со страной",
    )
    .nullable(),
);
const brandFields = {
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

  countryId,
};

function validateSlug(name: string, slug: string) {
  if (slug !== generateSlug(name)) {
    throw new ActionError({
      code: "BAD_REQUEST",
      message: "Slug is incorrect",
    });
  }
}

export const brand = {
  createBrand: defineAction({
    accept: "form",
    input: z.object(brandFields),
    handler: async (input, { locals }) => {
      requireAdmin(locals);
      const cleanName = input.name.replace(/\s+/g, " ");
      validateSlug(cleanName, input.slug);
      return await createBrand({
        name: cleanName,
        slug: input.slug,
        countryId: input.countryId,
        // image: input.image
      });
    },
  }),
  deleteBrand: defineAction({
    accept: "form",
    input: z.object({
      id: z.coerce.number().int().positive(),
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
      ...brandFields,
      id: z.coerce.number().int().positive(),
    }),
    handler: async (input, { locals }) => {
      requireAdmin(locals);
      const cleanName = input.name.replace(/\s+/g, " ");
      validateSlug(cleanName, input.slug);

      return await updateBrand({
        id: input.id,
        name: cleanName,
        slug: input.slug,
        countryId: input.countryId,
      });
    },
  }),
};
