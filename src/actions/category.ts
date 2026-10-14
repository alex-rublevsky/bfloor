import { z } from "astro/zod";
import { defineAction, ActionError } from "astro:actions";
import { requireAdmin } from "@/lib/api/requireAdmin";
import {
  deleteCategory,
  updateCategory,
  createCategory,
} from "@/db/dashboard/categories/index";
import { db } from "@/db";
import { attributes, categories, products } from "@/db/schema";
import { and, eq, inArray, ne, or } from "drizzle-orm";
import {
  cleanNameAndValidateSlug,
  description,
  id,
  name,
  slug,
} from "./helpers";

async function validateCategoryUniqueness(
  name: string,
  slug: string,
  id: number = 0,
) {
  const [suchCategoryAlreadyExists] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(
      or(
        and(eq(categories.slug, slug), ne(categories.id, id)),
        and(eq(categories.name, name), ne(categories.id, id)),
      ),
    )
    .limit(1);

  if (suchCategoryAlreadyExists) {
    throw new ActionError({
      code: "CONFLICT",
      message: "Категория с таким названием или ярлыком уже существует",
    });
  }
}

async function validateHiddenAttributeIds(ids: number[]) {
  const existingAttributes = await db
    .select({ id: attributes.id })
    .from(attributes)
    .where(inArray(attributes.id, ids));

  if (existingAttributes.length !== ids.length) {
    throw new ActionError({
      code: "BAD_REQUEST",
      message: "Выбран несуществующий атрибут",
    });
  }
}

const categoryFields = {
  name,
  slug,
  description,
  hiddenAttributes: z
    .array(
      z
        .int("ID атрибута должно быть целым числом")
        .positive("ID атрибута должен быть больше нуля"),
      "Список скрытых атрибутов должен быть массивом",
    )
    .refine((items) => new Set(items).size === items.length, {
      message: "Нельзя выбрать один и тот же атрибут несколько раз",
    }),
  // image: z.instanceof(File),
};

export const category = {
  createCategory: defineAction({
    accept: "form",
    input: z.object(categoryFields),
    handler: async (input, { locals }) => {
      requireAdmin(locals);

      const cleanName = cleanNameAndValidateSlug(input.name, input.slug);

      await validateCategoryUniqueness(cleanName, input.slug);

      await validateHiddenAttributeIds(input.hiddenAttributes);

      return await createCategory({
        name: cleanName,
        slug: input.slug,
        description: input.description,
        hiddenAttributes: input.hiddenAttributes,
        // image: input.image,
      });
    },
  }),
  deleteCategory: defineAction({
    accept: "form",
    input: z.object({
      id: id("категории"),
    }),
    handler: async (input, { locals }) => {
      requireAdmin(locals);

      const [productExists] = await db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.categoryId, input.id))
        .limit(1);

      if (productExists) {
        throw new ActionError({
          code: "CONFLICT",
          message: "Перед удалением категории удалите её товары",
        });
      }
      const deletionResult = await deleteCategory({
        id: input.id,
      });
      if (deletionResult === null) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Категория не найдена",
        });
      } else {
        return deletionResult;
      }
    },
  }),
  updateCategory: defineAction({
    accept: "form",
    input: z.object({
      ...categoryFields,
      id: id("категории"),
    }),
    handler: async (input, { locals }) => {
      requireAdmin(locals);

      const [thisCategoryExists] = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.id, input.id))
        .limit(1);

      if (!thisCategoryExists) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Категория не найдена",
        });
      }

      const cleanName = cleanNameAndValidateSlug(input.name, input.slug);

      await validateCategoryUniqueness(cleanName, input.slug, input.id);

      await validateHiddenAttributeIds(input.hiddenAttributes);

      // TODO:
      // 1. find newly added hidden attributes
      // 2. find products within this category that have those attributes applied to them
      // 3. prompt the user to confirm that those (list them) products will have these (listed) attributes with thier selected values deleted from them

      // TODO: add NOT FOUND via updateResult that can be null

      const updateResult = await updateCategory({
        name: cleanName,
        slug: input.slug,
        description: input.description,
        hiddenAttributes: input.hiddenAttributes,
        id: input.id,
      });
      if (updateResult === null) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Категория не найдена",
        });
      } else {
        return updateResult;
      }
    },
  }),
};
