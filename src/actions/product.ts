import {
  deleteProduct,
  updateProduct,
  bulkUpdateProducts,
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

function generateUniqueSlug(slug: string, collectionId: number | null) {
  if (collectionId) {
    return slug + "-" + collectionId;
  } else {
    return slug;
  }
}

async function validateProductUniqueness(
  name: string,
  slug: string,
  collectionId: number | null,
  id: number = 0,
) {
  const [suchProductSlugAlreadyExists] = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.slug, slug), ne(products.id, id)))
    .limit(1);

  if (suchProductSlugAlreadyExists) {
    throw new ActionError({
      code: "CONFLICT",
      message: "Товар с таким ярлыком уже существует",
    });
  }
  if (collectionId) {
    const [suchProductNameAlreadyExists] = await db
      .select({ id: products.id })
      .from(products)
      .where(
        and(
          eq(products.collectionId, collectionId),
          eq(products.name, name),
          ne(products.id, id),
        ),
      )
      .limit(1);

    if (suchProductNameAlreadyExists) {
      throw new ActionError({
        code: "CONFLICT",
        message: "Товар с таким названием уже существует в этой коллекции",
      });
    }
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
      message: "Коллекция не может быть выбрана без производителя",
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
        message: "Выбранного производителя не существует",
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
        message: "Выбранная коллекция не принадлежит выбранному производителю",
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
        message: "Скидочная цена должна быть меньше основной",
      });
    }
    return;
  } else if (!price && discountedPrice) {
    throw new ActionError({
      code: "BAD_REQUEST",
      message: "Скидочная цена не может быть установлена без основной",
    });
  } else {
    return;
  }
}
async function validateSKU(
  sku: string | null,
  collectionId: number | null,
  id: number = 0,
) {
  if (!sku) return;

  if (collectionId && sku) {
    const [existingSKU] = await db
      .select({ id: products.id })
      .from(products)
      .where(
        and(
          eq(products.collectionId, collectionId),
          eq(products.sku, sku),
          ne(products.id, id),
        ),
      )
      .limit(1);
    if (existingSKU) {
      throw new ActionError({
        code: "CONFLICT",
        message: "Такой артикул уже существует в выбранной коллекции",
      });
    }
  } else if (!collectionId && sku) {
    const [existingSKU] = await db
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.sku, sku), ne(products.id, id)))
      .limit(1);
    if (existingSKU) {
      throw new ActionError({
        code: "CONFLICT",
        message:
          "Такой артикул уже существует среди всех товаров. Если выбрать определённого производителя, то артикул должен будет быть уникальным лишь в контексте выбранного бренда",
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
    .int("ID производителя должно быть целым числом")
    .positive("ID производителя должен быть больше нуля")
    .nullable(),
  collectionId: z
    .int("ID коллекции должно быть целым числом")
    .positive("ID коллекции должен быть больше нуля")
    .nullable(),
  price: nullableNumber("Цена"),
  discountedPrice: nullableNumber("Скидка"),
  description,
  importantNote: description,
  dimensions: description,
  storeLocationIds,
  unitOfMeasurement,
  squareMetersPerPack: nullableNumber("Площадь упаковки"),
  attributeValueIds,
  // images: z.array(z.string()).default([]),
};

const bulkUpdateInput = z
  .object({
    mode: z.enum(
      ["preview", "apply"],
      "Ошибка типа запроса для группового изменения товара",
    ),
    ids: z.array(id("товара")).min(1, "Выберите хотя бы один товар"),
    price: z
      .number(`Цена должна быть числом`)
      .positive(
        `Благотворительностью не занимаемся, нулевую цену не указываем!`,
      )
      .nullable(),
    discountedPrice: z
      .number(`Скидочная цена должна быть числом`)
      .nonnegative(`Скидочная цена не может быть отрицательной`)
      .nullable(),
  })
  .superRefine((input, ctx) => {
    if (input.price === undefined && input.discountedPrice === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["price"],
        message: "Укажите хотя бы одно значение для изменения",
      });
    }
  });

export const product = {
  bulkUpdateProducts: defineAction({
    accept: "form",
    input: bulkUpdateInput,

    handler: async (input, { locals }) => {
      requireAdmin(locals);
      const ids = [...new Set(input.ids)];
      const changes: {
        price?: number | null;
        discountedPrice?: number | null;
      } = {};

      // if (input.price === 0) {
      //   throw new ActionError({
      //     code: "BAD_REQUEST",
      //     message:
      //       "Благотворительностью не занимаемся, нулевую цену не указываем!",
      //   });
      // }

      if (input.price !== undefined) {
        changes.price = input.price;
      }

      if (input.discountedPrice !== undefined) {
        changes.discountedPrice = input.discountedPrice;

        validateDiscount(changes.price ?? null, changes.discountedPrice);
      }

      //       if (Object.keys(changes).length === 0 && !input.applyStoreLocations) {
      //         throw new ActionError({
      //           code: "BAD_REQUEST",
      //           message: "Выберите поля для изменения",
      //         });
      //       }

      if (input.mode === "preview") {
        return {
          mode: "preview" as const,
          ids,
          count: ids.length,
          changes,
        };
      }

      // this is here to allow resetting the discount to 0
      if (changes.discountedPrice === 0) {
        changes.discountedPrice = null;
      }

      await bulkUpdateProducts({ ids, changes });

      return {
        mode: "applied" as const,
        updatedCount: ids.length,
      };
    },
  }),
  createProduct: defineAction({
    accept: "form",
    input: z.object(productFields),
    handler: async (input, { locals }) => {
      requireAdmin(locals);
      const cleanName = cleanNameAndValidateSlug(input.name, input.slug);
      const uniqueSlug = generateUniqueSlug(input.slug, input.collectionId);

      await validateProductUniqueness(
        cleanName,
        uniqueSlug,
        input.collectionId,
      );

      // TODO: integrate validation of price and discounted price relative to variations —
      // 1. price and discount are to be permitted only if there are no variations
      // 2. price is to be required if there are no variations
      // 2. if there are variations, price and discount are to be disabled and reset (notify)

      await validateDiscount(input.price, input.discountedPrice);

      await validateSKU(input.sku, input.collectionId);

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
          slug: uniqueSlug,
          sku: input.sku,
          categoryId: input.categoryId,
          brandId: input.brandId,
          collectionId: input.collectionId,
          price: input.price,
          discountedPrice: input.discountedPrice,
          description: input.description,
          importantNote: input.importantNote,
          dimensions: input.dimensions,
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

      // TODO: slug CAN be different than the name, since the slug is
      // globally unique while the name is unique within a collection.
      // Though it should still be 1:1 in the context of all entities other than products
      const cleanName = cleanNameAndValidateSlug(input.name, input.slug);
      const uniqueSlug = generateUniqueSlug(input.slug, input.collectionId);

      await validateProductUniqueness(
        cleanName,
        uniqueSlug,
        input.collectionId,
        input.id,
      );

      await validateDiscount(input.price, input.discountedPrice);

      await validateSKU(input.sku, input.collectionId, input.id);

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

      const updateResult = await updateProduct({
        id: input.id,
        isActive: input.isActive,
        name: cleanName,
        slug: uniqueSlug,
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
        dimensions: input.dimensions,
        productAttributeValues: productAttributeValues,
      });
      if (updateResult === null) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Товар не найден",
        });
      } else {
        return updateResult;
      }
    },
  }),
};
