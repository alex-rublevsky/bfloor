import {
  deleteProduct,
  updateProduct,
  createProduct,
} from "@/db/dashboard/products/index";
import { requireAdmin } from "@/lib/api/requireAdmin";
import { z } from "astro/zod";
import { ActionError, defineAction } from "astro:actions";
// import {
//   finalizeMedia,
//   prepareMedia,
//   rollbackPreparedMedia,
// } from "@/lib/update-media";
// import { deleteObjects } from "@/lib/storage";
import { STORE_LOCATIONS } from "@/lib/storeLocations";
import { UNITS_OF_MEASUREMENT } from "@/lib/units";
import { db } from "@/db";
import {
  attributeValues,
  brands,
  categories,
  collections,
  products,
} from "@/db/schema";
import { and, eq, inArray, ne, or } from "drizzle-orm";
import type { AttributeSelection } from "@/db/dashboard/products/index";
import {
  cleanNameAndValidateSlug,
  description,
  id,
  name,
  nullableNumber,
  slug,
} from "./helpers";

async function validateProductUniqueness(
  name: string,
  slug: string,
  id: number = 0,
) {
  const [suchProductAlreadyExists] = await db
    .select({ id: products.id })
    .from(products)
    .where(
      or(
        and(eq(products.slug, slug), ne(products.id, id)),
        and(eq(products.name, name), ne(products.id, id)),
      ),
    )
    .limit(1);

  if (suchProductAlreadyExists) {
    throw new ActionError({
      code: "CONFLICT",
      message: "Товар с таким названием или ярлыком уже существует",
    });
  }
}

async function validateBrandAndCollection(
  brandId: number | null,
  collectionId: number | null,
) {
  // TODO: does it make sense to parallelize fetch of brand and collection if both a present?
  if (!brandId && collectionId) {
    throw new ActionError({
      code: "BAD_REQUEST",
      message: "Коллекция не может быть выбрана без бренда",
    });
  }

  if (brandId) {
    const [existingBrand] = await db
      .select({
        id: brands.id,
      })
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

  if (collectionId) {
    const [collection] = await db
      .select({
        id: collections.id,
        brandId: collections.brandId,
      })
      .from(collections)
      .where(eq(collections.id, collectionId))
      .limit(1);
    if (!collection) {
      throw new ActionError({
        code: "NOT_FOUND",
        message: "Выбранной коллекции не существует",
      });
    }

    if (collection.brandId !== brandId) {
      throw new ActionError({
        code: "BAD_REQUEST",
        message: "Выбранная коллекция не принадлежит выбранному бренду",
      });
    }
  }
}

async function resolveProductAttributeValues(
  ids: number[],
): Promise<AttributeSelection[]> {
  const existingAttributeValues = await db
    .select({
      attributeId: attributeValues.attributeId,
      attributeValueId: attributeValues.id,
    })
    .from(attributeValues)
    .where(inArray(attributeValues.id, ids));

  if (existingAttributeValues.length !== ids.length) {
    throw new ActionError({
      code: "BAD_REQUEST",
      message: "Выбрано несуществующее значение атрибута",
    });
  }

  return existingAttributeValues;
}

async function resolveCategoryAndAllowedAttributeValues(
  categoryId: number,
  attributeValueIds: number[],
): Promise<AttributeSelection[]> {
  const [category] = await db
    .select({
      id: categories.id,
      hiddenAttributes: categories.hiddenAttributes,
    })
    .from(categories)
    .where(eq(categories.id, categoryId))
    .limit(1);

  if (!category) {
    throw new ActionError({
      code: "NOT_FOUND",
      message: "Выбранной категории не существует",
    });
  }

  if (attributeValueIds.length === 0) return [];

  const selections = await resolveProductAttributeValues(attributeValueIds);

  //   TODO: is it better to have here
  //   const hiddenAttributeIds = new Set(hiddenAttributes);
  //   and then use .has instead of .includes? why?
  return selections.filter(
    ({ attributeId }) => !category.hiddenAttributes.includes(attributeId),
  );
}

async function validateDiscount(
  price: number | null,
  discountedPrice: number | null,
) {
  if (price && discountedPrice) {
    if (price < discountedPrice) {
      throw new ActionError({
        code: "BAD_REQUEST",
        message: "Скидочная цена не может быть выше основной",
      });
    }
    return;
  }
  return;
}
async function validateSKU(
  sku: string | null,
  brandId: number | null,
  id: number = 0,
) {
  if (!sku) return;

  if (brandId && sku) {
    const [existingSKU] = await db
      .select({ id: products.id })
      .from(products)
      .where(
        and(
          eq(products.brandId, brandId),
          eq(products.sku, sku),
          ne(products.id, id),
        ),
      )
      .limit(1);
    if (existingSKU) {
      throw new ActionError({
        code: "CONFLICT",
        message: "Такой артикул уже существует в выбранном бренде",
      });
    }
  } else if (!brandId && sku) {
    const [existingSKU] = await db
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.sku, sku), ne(products.id, id)))
      .limit(1);
    if (existingSKU) {
      throw new ActionError({
        code: "CONFLICT",
        message:
          "Такой артикул уже существует среди всех товаров. Если выбрать определённый бренд, то артикул должен будет быть уникальным лишь в контексте выбранного бренда",
      });
    }
  }
}

type UnitOfMeasurement = (typeof UNITS_OF_MEASUREMENT)[number]["id"];
const unitOfMeasurementIds = UNITS_OF_MEASUREMENT.map(({ id }) => id) as [
  UnitOfMeasurement,
  ...UnitOfMeasurement[],
];
const unitOfMeasurement = z.enum(
  unitOfMeasurementIds,
  "Единица измерения указана некорректно",
);

const storeLocationId = z
  .int("ID магазина должно быть целым числом")
  .nonnegative("ID магазина не может быть отрицательным числом")
  .refine(
    (id) => STORE_LOCATIONS.some((location) => location.id === id),
    "Выбран несуществующий магазин",
  );

//TODO: how exactly does the superRefine work?
const storeLocationIds = z
  .array(storeLocationId, "Список магазинов должен быть массивом")
  .min(1, "Необходимо выбрать хотя бы один магазин")
  .superRefine((ids, ctx) => {
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({
        code: "custom",
        message: "Нельзя выбрать один и тот же магазин несколько раз",
      });
    }
  });

const sku = z
  .string()
  .trim()
  .normalize()
  .toUpperCase()
  .transform((value) => (value === "" ? null : value))
  .nullable();

const attributeValueIds = z
  .array(
    z
      .int("ID значения атрибута должно быть целым числом")
      .positive("ID значения атрибута должен быть больше нуля"),
    "Список значений атрибутов должен быть массивом",
  )
  .refine((items) => new Set(items).size === items.length, {
    message: "Нельзя выбрать одно и то же значение атрибута несколько раз",
  });

const productFields = {
  isActive: z.coerce.boolean(
    "Статус активности товара должен иметь логическое значение",
  ),
  name,
  slug,
  sku,
  categoryId: z
    .int({
      error: (iss) =>
        iss.input === null
          ? "Категория обязательна"
          : "ID категории должно быть целым числом",
    })
    .positive("ID категории должен быть больше нуля"),
  brandId: z
    .int("ID бренда должно быть целым числом")
    .positive("ID бренда должен быть больше нуля")
    .nullable(),
  collectionId: z
    .int("ID коллекции должно быть целым числом")
    .positive("ID коллекции должен быть больше нуля")
    .nullable(),
  price: nullableNumber("Цена"),
  discountedPrice: nullableNumber("Скидка"),
  description,
  importantNote: description,
  storeLocationIds,
  unitOfMeasurement,
  squareMetersPerPack: nullableNumber("Площадь упаковки"),
  attributeValueIds,
  // images: z.array(z.string()).default([]),
};

export const product = {
  createProduct: defineAction({
    accept: "form",
    input: z.object(productFields),
    handler: async (input, { locals }) => {
      requireAdmin(locals);
      const cleanName = cleanNameAndValidateSlug(input.name, input.slug);

      await validateProductUniqueness(cleanName, input.slug);

      // TODO: integrate validation of price and discounted price relative to variations —
      // 1. price and discount are to be permitted only if there are no variations
      // 2. price is to be required if there are no variations
      // 2. if there are variations, price and discount are to be disabled and reset (notify)

      await validateDiscount(input.price, input.discountedPrice);

      await validateSKU(input.sku, input.brandId);

      // const media = await prepareMedia({
      //   slug: input.slug,
      //   submittedImages: input.images,
      //   currentImages: [],
      // });

      await validateBrandAndCollection(input.brandId, input.collectionId);

      // TODO: it should be validated that for each attribute that variations have, the general product does not have them selected
      const productAttributeValues =
        await resolveCategoryAndAllowedAttributeValues(
          input.categoryId,
          input.attributeValueIds,
        );
      // TODO:verify that every submitted variation value belongs to the selected attribute

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

          productAttributeValues: productAttributeValues,
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
      id: id("товара"),
      // image: z.string(),
    }),
    handler: async (input, { locals }) => {
      requireAdmin(locals);

      const deletionResult = await deleteProduct({
        id: input.id,
      });
      if (deletionResult === null) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Товар не найден",
        });
      } else {
        //   await deleteObjects(deleted.images).catch((error) => {
        //     console.error("Unable to delete product media", error);
        //   });
        return deletionResult;
      }
    },
  }),
  updateProduct: defineAction({
    accept: "form",
    input: z.object({
      ...productFields,
      id: id("товара"),
    }),
    handler: async (input, { locals }) => {
      requireAdmin(locals);

      const [thisProductExists] = await db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.id, input.id))
        .limit(1);

      if (!thisProductExists) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Товар не найден",
        });
      }

      const cleanName = cleanNameAndValidateSlug(input.name, input.slug);

      await validateProductUniqueness(cleanName, input.slug, input.id);

      await validateDiscount(input.price, input.discountedPrice);

      await validateSKU(input.sku, input.brandId, input.id);

      // const media = await prepareMedia({
      //   slug: input.slug,
      //   submittedImages: input.images,
      //   currentImages: existingProduct.images,
      // });

      await validateBrandAndCollection(input.brandId, input.collectionId);

      const productAttributeValues =
        await resolveCategoryAndAllowedAttributeValues(
          input.categoryId,
          input.attributeValueIds,
        );
      // TODO:verify that every submitted variation value belongs to the selected attribute

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
          productAttributeValues: productAttributeValues,
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
