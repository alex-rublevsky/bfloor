import {
  deleteProduct,
  updateProduct,
  createProduct,
} from "@/db/dashboard/products/index";
import { requireAdmin } from "@/lib/api/requireAdmin";
import { z } from "astro/zod";
import { defineAction } from "astro:actions";
import { updateMedia } from "@/lib/update-media";

export const product = {
  createProduct: defineAction({
    accept: "form",
    input: z.object({
      name: z.string(),
      slug: z.string(),
      categoryId: z.coerce.number().int().positive(),
      price: z.coerce.number().nonnegative(),
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
    }),
    handler: async (input, { locals }) => {
      requireAdmin(locals);

      const finalImages = await updateMedia({
        slug: input.slug,
        submittedImages: input.images,
      });

      return await createProduct({
        isActive: true,
        name: input.name,
        slug: input.slug,
        categoryId: input.categoryId,
        price: input.price,
        discountedPrice: input.discountedPrice,
        description: null,
        importantNote: null,
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
      name: z.string(),
      slug: z.string(),
      isActive: z.boolean(),
      importantNote: z.string().nullable(),
      price: z.coerce.number().nonnegative(),
      discountedPrice: z.preprocess(
        (value) => (value === "" ? null : value),
        z.coerce.number().nonnegative().nullable(),
      ),
      categoryId: z.coerce.number().int().positive(),
      description: z.string().nullable(),
    }),
    handler: async (input, { locals }) => {
      requireAdmin(locals);

      return await updateProduct({
        id: input.id,
        isActive: input.isActive,
        name: input.name,
        slug: input.slug,
        importantNote: input.importantNote,
        price: input.price,
        discountedPrice: input.discountedPrice,
        categoryId: input.categoryId,
        description: input.description,
      });
    },
  }),
};
