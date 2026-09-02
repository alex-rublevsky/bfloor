import {
  deleteProduct,
  updateProduct,
  createProduct,
} from "@/db/dashboard/products/index";
import { requireAdmin } from "@/lib/api/requireAdmin";
import { z } from "astro/zod";
import { ActionError, defineAction } from "astro:actions";
import { updateMedia } from "@/lib/update-media";
import { STORE_LOCATIONS } from "@/lib/storeLocations";
import { generateSlug } from "@/lib/slugGeneration";

const storeLocationId = z.coerce
  .number()
  .int()
  .positive()
  .refine(
    (id) => STORE_LOCATIONS.some((location) => location.id === id),
    "Invalid store location",
  );

const storeLocationIds = z.array(storeLocationId).default([]);

export const product = {
  createProduct: defineAction({
    accept: "form",
    input: z.object({
      isActive: z.boolean(),
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
      //TODO: add superRefine to check whether the slug matches the name
      categoryId: z.coerce
        .number("Категория обязательна")
        .int()
        .positive("Категория обязательна"),
      //TODO: An empty brand or collection select may also be
      // coerced to 0 before validation, causing .positive() to fail.
      brandId: z.coerce.number().int().positive().nullable(),
      collectionId: z.coerce.number().int().positive().nullable(),
      //price is nullable for when there are variations
      price: z.coerce.number().nonnegative().nullable(),
      discountedPrice: z.preprocess(
        (value) => (value === "" ? null : value),
        z.coerce.number().nonnegative().nullable(),
      ),
      description: z.preprocess(
        (value) => (value === "" ? null : value),
        z.string().nullable(),
      ),
      importantNote: z.preprocess(
        (value) => (value === "" ? null : value),
        z.string().nullable(),
      ),
      images: z.array(z.string()).default([]),
      storeLocationIds,
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

      //TODO: validate that brand and collection exist + their relationship

      const finalImages = await updateMedia({
        slug: input.slug,
        submittedImages: input.images,
      });

      return await createProduct({
        isActive: input.isActive,
        name: cleanName,
        slug: input.slug,
        categoryId: input.categoryId,
        brandId: input.brandId,
        collectionId: input.collectionId,
        price: input.price,
        storeLocationIds: input.storeLocationIds,
        discountedPrice: input.discountedPrice,
        description: input.description,
        importantNote: input.importantNote,
        images: finalImages,
      });
    },
  }),
  deleteProduct: defineAction({
    accept: "form",
    input: z.object({
      id: z.coerce.number().int().positive(),
      // image: z.string(),
    }),
    handler: async (input, { locals }) => {
      requireAdmin(locals);
      return await deleteProduct({
        id: input.id,
      });
    },
  }),
  updateProduct: defineAction({
    accept: "form",
    input: z.object({
      id: z.coerce.number(),
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
      isActive: z.boolean(),
      price: z.coerce.number().nonnegative().nullable(),
      discountedPrice: z.preprocess(
        (value) => (value === "" ? null : value),
        z.coerce.number().nonnegative().nullable(),
      ),
      categoryId: z.coerce
        .number("Категория обязательна")
        .int()
        .positive("Категория обязательна"),
      images: z.array(z.string()).default([]),
      brandId: z.coerce.number().int().positive().nullable(),
      collectionId: z.coerce.number().int().positive().nullable(),
      description: z.preprocess(
        (value) => (value === "" ? null : value),
        z.string().nullable(),
      ),
      importantNote: z.preprocess(
        (value) => (value === "" ? null : value),
        z.string().nullable(),
      ),
      storeLocationIds,
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

      //TODO: validate that brand and collection exist + their relationship

      const finalImages = await updateMedia({
        slug: input.slug,
        submittedImages: input.images,
      });

      return await updateProduct({
        id: input.id,
        isActive: input.isActive,
        name: cleanName,
        slug: input.slug,
        importantNote: input.importantNote,
        price: input.price,
        discountedPrice: input.discountedPrice,
        categoryId: input.categoryId,
        brandId: input.brandId,
        collectionId: input.collectionId,
        description: input.description,
        storeLocationIds: input.storeLocationIds,
        images: finalImages,
      });
    },
  }),
};
