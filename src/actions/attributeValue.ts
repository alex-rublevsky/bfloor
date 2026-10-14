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
import {
  attributes,
  attributeValues,
  productAttributeValues,
  variationAttributeValues,
} from "@/db/schema";
import { and, eq, ne, or } from "drizzle-orm";

async function validateValueUniquenessWithinAttribute(
  normalizedName: string,
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
          and(
            eq(attributeValues.normalizedName, normalizedName),
            ne(attributeValues.id, id),
          ),
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
    input: z.object({
      name,
      slug,
      attributeId: z
        .int("ID значения атрибута должно быть целым числом")
        .positive("ID значения атрибута должен быть больше нуля"),
    }),
    handler: async (input, { locals }) => {
      requireAdmin(locals);

      const [parentAttribute] = await db
        .select({
          id: attributes.id,
        })
        .from(attributes)
        .where(eq(attributes.id, input.attributeId))
        .limit(1);

      if (!parentAttribute) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Атрибут не найден",
        });
      }

      const cleanName = cleanNameAndValidateSlug(input.name, input.slug);
      const normalizedName = cleanName.toLowerCase();

      // const attributeId =
      await validateValueUniquenessWithinAttribute(
        normalizedName,
        input.slug,
        input.attributeId,
      );

      //TODO: validate uniqueness
      return await createAttributeValue({
        name: cleanName,
        normalizedName,
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

      const [variationExists] = await db
        .select({ id: variationAttributeValues.id })
        .from(variationAttributeValues)
        .where(eq(variationAttributeValues.attributeValueId, input.id))
        .limit(1);

      if (variationExists) {
        throw new ActionError({
          code: "CONFLICT",
          message:
            "Перед удалением значения атрибута удалите вариации товаров связанные с ним",
        });
      }

      const deletionResult = await deleteAttributeValue({
        id: input.id,
      });
      if (deletionResult === null) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Значение атрибута не найдено",
        });
      } else {
        return deletionResult;
      }
    },
  }),
  updateAttributeValue: defineAction({
    accept: "form",
    input: z.object({
      id: id("значения атрибута"),
      name,
      slug,
    }),
    handler: async (input, { locals }) => {
      requireAdmin(locals);

      const [existingValue] = await db
        .select({
          id: attributeValues.id,
          attributeId: attributeValues.attributeId,
        })
        .from(attributeValues)
        .where(eq(attributeValues.id, input.id))
        .limit(1);

      if (!existingValue) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Значение атрибута не найдено",
        });
      }

      const cleanName = cleanNameAndValidateSlug(input.name, input.slug);
      const normalizedName = cleanName.toLowerCase();

      await validateValueUniquenessWithinAttribute(
        normalizedName,
        input.slug,
        existingValue.attributeId,
        input.id,
      );

      const updateResult = await updateAttributeValue({
        id: existingValue.id,
        name: cleanName,
        normalizedName,
        slug: input.slug,
      });
      if (updateResult === null) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Значение атрибута не найдено",
        });
      } else {
        return updateResult;
      }
    },
  }),
};
