import { z } from "astro/zod";
import { defineAction, ActionError } from "astro:actions";
import { requireAdmin } from "@/lib/api/requireAdmin";
import {
  deleteAttribute,
  updateAttribute,
  createAttribute,
} from "@/db/dashboard/attributes/index";

import { cleanNameAndValidateSlug, id, name, slug } from "./helpers";
import { db } from "@/db";
import { attributes, attributeValues } from "@/db/schema";
import { and, eq, ne, or } from "drizzle-orm";

async function validateAttributeUniqueness(
  name: string,
  slug: string,
  id: number = 0,
) {
  const [suchAttributeAlreadyExists] = await db
    .select({ id: attributes.id })
    .from(attributes)
    .where(
      or(
        and(eq(attributes.slug, slug), ne(attributes.id, id)),
        and(eq(attributes.name, name), ne(attributes.id, id)),
      ),
    )
    .limit(1);

  if (suchAttributeAlreadyExists) {
    throw new ActionError({
      code: "CONFLICT",
      message: "Атрибут с таким названием или ярлыком уже существует",
    });
  }
}

const attributeFields = { name, slug };

export const attribute = {
  createAttribute: defineAction({
    accept: "form",
    input: z.object(attributeFields),
    handler: async (input, { locals }) => {
      requireAdmin(locals);
      const cleanName = cleanNameAndValidateSlug(input.name, input.slug);

      await validateAttributeUniqueness(cleanName, input.slug);

      return await createAttribute({
        name: cleanName,
        slug: input.slug,
      });
    },
  }),
  deleteAttribute: defineAction({
    accept: "form",
    input: z.object({
      id: id("атрибута"),
      // image: z.string(),
    }),
    handler: async (input, { locals }) => {
      requireAdmin(locals);

      const [attribueValueExists] = await db
        .select({ id: attributeValues.id })
        .from(attributeValues)
        .where(eq(attributeValues.attributeId, input.id))
        .limit(1);

      if (attribueValueExists) {
        throw new ActionError({
          code: "CONFLICT",
          message: "Перед удалением атрибута удалите его значения",
        });
      }

      return await deleteAttribute({
        id: input.id,
      });
    },
  }),
  updateAttribute: defineAction({
    accept: "form",
    input: z.object({
      ...attributeFields,
      id: id("атрибута"),
    }),
    handler: async (input, { locals }) => {
      requireAdmin(locals);

      const [thisAttributeExists] = await db
        .select({ id: attributes.id })
        .from(attributes)
        .where(eq(attributes.id, input.id))
        .limit(1);

      if (!thisAttributeExists) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Атрибут не найден",
        });
      }

      const cleanName = cleanNameAndValidateSlug(input.name, input.slug);

      await validateAttributeUniqueness(cleanName, input.slug, input.id);

      return await updateAttribute({
        name: cleanName,
        slug: input.slug,
        id: input.id,
      });
    },
  }),
};
