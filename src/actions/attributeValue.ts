import { z } from "astro/zod";
import { defineAction, ActionError } from "astro:actions";
import { requireAdmin } from "@/lib/api/requireAdmin";
import {
  deleteAttributeValue,
  updateAttributeValue,
  createAttributeValue,
} from "@/db/dashboard/attributes/index";
import { cleanNameAndValidateSlug, id, name, slug } from "./helpers";
import { db } from "@/db";
import { attributeValues, productAttributeValues } from "@/db/schema";
import { and, eq, ne, or } from "drizzle-orm";

const attributeValueFields = {
  name,
  slug,
  attributeId: z
    .int("ID значения атрибута должно быть целым числом")
    .positive("ID значения атрибута должен быть больше нуля"),
};

async function validateValueUniquenessWithinAttribute(
  name: string,
  slug: string,
  attributeId: number,
  id: number = 0,
) {
  const [suchAttributeValueAlreadyExists] = await db
    .select({ id: attributeValues.id })
    .from(attributeValues)
    .where(
      and(
        eq(attributeValues.attributeId, attributeId),
        or(
          and(eq(attributeValues.slug, slug), ne(attributeValues.id, id)),
          and(eq(attributeValues.name, name), ne(attributeValues.id, id)),
        ),
      ),
    )
    .limit(1);

  if (suchAttributeValueAlreadyExists) {
    throw new ActionError({
      code: "CONFLICT",
      message:
        "Значение с таким названием или ярлыком уже существует у этого атрибута",
    });
  }
}

export const attributeValue = {
  createAttributeValue: defineAction({
    accept: "form",
    input: z.object(attributeValueFields),
    handler: async (input, { locals }) => {
      requireAdmin(locals);

      const cleanName = cleanNameAndValidateSlug(input.name, input.slug);

      await validateValueUniquenessWithinAttribute(
        cleanName,
        input.slug,
        input.attributeId,
      );

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
      id: id("значения атрибута"),
    }),
    handler: async (input, { locals }) => {
      requireAdmin(locals);

      const [productExists] = await db
        .select({ id: productAttributeValues.id })
        .from(productAttributeValues)
        .where(eq(productAttributeValues.attributeValueId, input.id))
        .limit(1);

      if (productExists) {
        throw new ActionError({
          code: "CONFLICT",
          message:
            "Перед удалением значения атрибута удалите товары связанные с ним",
        });
      }
      return await deleteAttributeValue({
        id: input.id,
      });
    },
  }),
  updateAttributeValue: defineAction({
    accept: "form",
    input: z.object({
      ...attributeValueFields,
      id: id("значения атрибута"),
    }),
    handler: async (input, { locals }) => {
      requireAdmin(locals);

      const [thisAttributeValueExists] = await db
        .select({ id: attributeValues.id })
        .from(attributeValues)
        .where(eq(attributeValues.id, input.id))
        .limit(1);

      if (!thisAttributeValueExists) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Значение атрибута не найдено",
        });
      }

      const cleanName = cleanNameAndValidateSlug(input.name, input.slug);

      await validateValueUniquenessWithinAttribute(
        cleanName,
        input.slug,
        input.attributeId,
        input.id,
      );

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
