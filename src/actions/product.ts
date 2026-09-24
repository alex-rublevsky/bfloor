import {
  deleteProduct,
  updateProduct,
  createProduct,
  getProductById,
} from "@/db/dashboard/products/index";
import { requireAdmin } from "@/lib/api/requireAdmin";
import { z } from "astro/zod";
import { ActionError, defineAction } from "astro:actions";
// import {
//   finalizeMedia,
//   prepareMedia,
//   rollbackPreparedMedia,
// } from "@/lib/update-media";
import { deleteObjects } from "@/lib/storage";
import { STORE_LOCATIONS } from "@/lib/storeLocations";
import { generateSlug } from "@/lib/slugGeneration";
import { UNITS_OF_MEASUREMENT } from "@/lib/units";
import { COUNTRIES } from "@/lib/countries";

type UnitOfMeasurement = (typeof UNITS_OF_MEASUREMENT)[number]["id"];
const unitOfMeasurementIds = UNITS_OF_MEASUREMENT.map(({ id }) => id) as [
  UnitOfMeasurement,
  ...UnitOfMeasurement[],
];
const unitOfMeasurement = z.enum(unitOfMeasurementIds);

type Country = (typeof COUNTRIES)[number]["id"];
const countryIds = COUNTRIES.map(({ id }) => z.literal(id)) as [
  z.ZodLiteral<Country>,
  ...z.ZodLiteral<Country>[],
];
const country = z.preprocess(
  (value) => (value === "" || value == null ? null : Number(value)),
  z.union(countryIds, "Ошибка со страной").nullable(),
);

const storeLocationId = z.coerce
  .number()
  .int()
  .nonnegative()
  .refine(
    (id) => STORE_LOCATIONS.some((location) => location.id === id),
    "Invalid store location",
  );

//TODO: how exactly does the superRefine work?
const storeLocationIds = z
  .array(storeLocationId)
  .min(1, "Необходимо выбрать как минимум один магазин")
  .superRefine((ids, ctx) => {
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({
        code: "custom",
        message: "Duplicate store locations are not allowed",
      });
    }
  });

const sku = z.preprocess(
  (value) => (value == null || value === "" ? null : String(value)),
  z.string().trim().normalize().toUpperCase().nullable(),
);

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
      sku,
      //TODO: add superRefine to check whether the slug matches the name
      categoryId: z.coerce
        .number("Категория обязательна")
        .int()
        .positive("Категория обязательна"),
      //TODO: An empty brand or collection select may also be
      // coerced to 0 before validation, causing .positive() to fail.
      brandId: z.coerce.number().int().positive().nullable(),
      collectionId: z.coerce.number().int().positive().nullable(),
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
      // images: z.array(z.string()).default([]),
      storeLocationIds,
      unitOfMeasurement,
      squareMetersPerPack: z.preprocess(
        (value) => (value === "" ? null : value),
        z.coerce.number().nonnegative().nullable(),
      ),
      country,
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

      // const media = await prepareMedia({
      //   slug: input.slug,
      //   submittedImages: input.images,
      //   currentImages: [],
      // });

      try {
        const created = await createProduct({
          isActive: input.isActive,
          name: cleanName,
          slug: input.slug,
          sku: input.sku,
          categoryId: input.categoryId,
          brandId: input.brandId,
          collectionId: input.collectionId,
          price: input.price,
          discountedPrice: input.discountedPrice,
          description: input.description,
          importantNote: input.importantNote,
          // images: media.finalImages,
          storeLocationIds: input.storeLocationIds,
          unitOfMeasurement: input.unitOfMeasurement,
          squareMetersPerPack: input.squareMetersPerPack,
          country: input.country,
        });
        // await finalizeMedia(media).catch((error) => {
        //   console.error("Unable to finalize product media", error);
        // });
        return created;
      } catch (error) {
        // await rollbackPreparedMedia(media).catch((cleanupError) => {
        //   console.error("Unable to roll back product media", cleanupError);
        // });
        throw error;
      }
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
      const deleted = await deleteProduct({
        id: input.id,
      });
      // if (deleted) {
      //   await deleteObjects(deleted.images).catch((error) => {
      //     console.error("Unable to delete product media", error);
      //   });
      // }
      return deleted;
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
      sku,
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
      // images: z.array(z.string()).default([]),
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
      unitOfMeasurement,
      squareMetersPerPack: z.preprocess(
        (value) => (value === "" ? null : value),
        z.coerce.number().nonnegative().nullable(),
      ),
      country,
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

      const existingProduct = await getProductById(input.id);
      if (!existingProduct) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      // const media = await prepareMedia({
      //   slug: input.slug,
      //   submittedImages: input.images,
      //   currentImages: existingProduct.images,
      // });

      try {
        const updated = await updateProduct({
          id: input.id,
          isActive: input.isActive,
          name: cleanName,
          slug: input.slug,
          sku: input.sku,
          importantNote: input.importantNote,
          price: input.price,
          discountedPrice: input.discountedPrice,
          categoryId: input.categoryId,
          brandId: input.brandId,
          collectionId: input.collectionId,
          description: input.description,
          storeLocationIds: input.storeLocationIds,
          // images: media.finalImages,
          unitOfMeasurement: input.unitOfMeasurement,
          squareMetersPerPack: input.squareMetersPerPack,
          country: input.country,
        });
        // await finalizeMedia(media).catch((error) => {
        //   console.error("Unable to finalize product media", error);
        // });
        return updated;
      } catch (error) {
        // await rollbackPreparedMedia(media).catch((cleanupError) => {
        //   console.error("Unable to roll back product media", cleanupError);
        // });
        throw error;
      }
    },
  }),
};
