import { z } from "astro/zod";
import { defineAction, ActionError } from "astro:actions";
import { requireAdmin } from "@/lib/api/requireAdmin";
import {
  deleteBrand,
  updateBrand,
  createBrand,
} from "@/db/dashboard/brands/index";
import { COUNTRIES } from "@/lib/countries";
import { name, slug, cleanNameAndValidateSlug, id } from "./helpers";
import { db } from "@/db";
import { and, eq, ne, or } from "drizzle-orm";
import { brands, collections, products } from "@/db/schema";

async function validateBrandUniqueness(
  name: string,
  slug: string,
  id: number = 0,
) {
  const [suchBrandAlreadyExists] = await db
    .select({ id: brands.id })
    .from(brands)
    .where(
      or(
        and(eq(brands.slug, slug), ne(brands.id, id)),
        and(eq(brands.name, name), ne(brands.id, id)),
      ),
    )
    .limit(1);

  if (suchBrandAlreadyExists) {
    throw new ActionError({
      code: "CONFLICT",
      message: "Бренд с таким названием или ярлыком уже существует",
    });
  }
}

const countryId = z
  .int("Страна должна быть указана целым числом")
  .refine(
    (value) => COUNTRIES.some((country) => country.id === value),
    "Выбрана несуществующая страна",
  )
  .nullable();

const brandFields = {
  name,
  slug,
  countryId,
};

export const brand = {
  createBrand: defineAction({
    accept: "form",
    input: z.object(brandFields),
    handler: async (input, { locals }) => {
      requireAdmin(locals);

      const cleanName = cleanNameAndValidateSlug(input.name, input.slug);

      await validateBrandUniqueness(cleanName, input.slug);

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
      id: id("брэнда"),
    }),
    handler: async (input, { locals }) => {
      requireAdmin(locals);
      const [collectionExists] = await db
        .select({ id: collections.id })
        .from(collections)
        .where(eq(collections.brandId, input.id))
        .limit(1);

      if (collectionExists) {
        throw new ActionError({
          code: "CONFLICT",
          message: "Перед удалением бренда удалите его коллекции",
        });
      }
      const [productExists] = await db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.brandId, input.id))
        .limit(1);

      if (productExists) {
        throw new ActionError({
          code: "CONFLICT",
          message: "Перед удалением бренда удалите его товары",
        });
      }

      const deletionResult = await deleteBrand({
        id: input.id,
      });
      if (deletionResult === null) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Бренд не найден",
        });
      } else {
        return deletionResult;
      }
    },
  }),
  updateBrand: defineAction({
    accept: "form",
    input: z.object({
      ...brandFields,
      id: id("брэнда"),
    }),
    handler: async (input, { locals }) => {
      requireAdmin(locals);

      const [thisBrandExists] = await db
        .select({ id: brands.id })
        .from(brands)
        .where(eq(brands.id, input.id))
        .limit(1);

      if (!thisBrandExists) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Бренд не найден",
        });
      }

      const cleanName = cleanNameAndValidateSlug(input.name, input.slug);

      await validateBrandUniqueness(cleanName, input.slug, input.id);

      const updateResult = await updateBrand({
        id: input.id,
        name: cleanName,
        slug: input.slug,
        countryId: input.countryId,
      });
      if (updateResult === null) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Бренд не найден",
        });
      } else {
        return updateResult;
      }
    },
  }),
};
