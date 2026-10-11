import { z } from "astro/zod";
import { defineAction, ActionError } from "astro:actions";
import { requireAdmin } from "@/lib/api/requireAdmin";
import {
  deleteCollection,
  updateCollection,
  createCollection,
} from "@/db/dashboard/brands/index";
import { cleanNameAndValidateSlug, id, name, slug } from "./helpers";
import { db } from "@/db";
import { brands, collections, products } from "@/db/schema";
import { and, eq, ne, or } from "drizzle-orm";

async function validateBrandExisting(brandId: number) {
  const [existingBrand] = await db
    .select({ id: brands.id })
    .from(brands)
    .where(eq(brands.id, brandId))
    .limit(1);

  if (!existingBrand) {
    throw new ActionError({
      code: "NOT_FOUND",
      message: "Выбранного бренда не существует",
    });
  }
}

async function validateCollectionUniquenessWithinBrand(
  name: string,
  slug: string,
  brandId: number,
  id: number = 0,
) {
  const [suchCollectionAlreadyExists] = await db
    .select({ id: collections.id })
    .from(collections)
    .where(
      and(
        eq(collections.brandId, brandId),
        or(
          and(eq(collections.slug, slug), ne(collections.id, id)),
          and(eq(collections.name, name), ne(collections.id, id)),
        ),
      ),
    )
    .limit(1);

  if (suchCollectionAlreadyExists) {
    throw new ActionError({
      code: "CONFLICT",
      message:
        "Коллекция с таким названием или ярлыком уже существует у этого бренда",
    });
  }
}

const collectionFields = {
  name,
  slug,
  brandId: id("бренда"),
};

export const collection = {
  createCollection: defineAction({
    accept: "form",
    input: z.object(collectionFields),
    handler: async (input, { locals }) => {
      requireAdmin(locals);

      const cleanName = cleanNameAndValidateSlug(input.name, input.slug);

      await validateBrandExisting(input.brandId);

      await validateCollectionUniquenessWithinBrand(
        cleanName,
        input.slug,
        input.brandId,
      );

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
      id: id("коллекции"),
      // image: z.string(),
    }),
    handler: async (input, { locals }) => {
      requireAdmin(locals);
      const [existingProduct] = await db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.collectionId, input.id))
        .limit(1);

      if (existingProduct) {
        throw new ActionError({
          code: "CONFLICT",
          message: "Перед удалением коллекции удалите её товары",
        });
      }
      const deletionResult = await deleteCollection({
        id: input.id,
      });
      if (deletionResult === null) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Коллекция не найдена",
        });
      } else {
        return deletionResult;
      }
    },
  }),
  updateCollection: defineAction({
    accept: "form",
    input: z.object({ ...collectionFields, id: id("коллекции") }),
    handler: async (input, { locals }) => {
      requireAdmin(locals);

      const [thisCollectionExists] = await db
        .select({ id: collections.id })
        .from(collections)
        .where(eq(collections.id, input.id))
        .limit(1);

      if (!thisCollectionExists) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Коллекция не найдена",
        });
      }

      const cleanName = cleanNameAndValidateSlug(input.name, input.slug);

      await validateCollectionUniquenessWithinBrand(
        cleanName,
        input.slug,
        input.brandId,
        input.id,
      );

      await validateBrandExisting(input.brandId);

      return await updateCollection({
        id: input.id,
        name: cleanName,
        slug: input.slug,
        brandId: input.brandId,
      });
    },
  }),
};
