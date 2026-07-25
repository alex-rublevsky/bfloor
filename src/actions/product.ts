import { defineAction } from "astro:actions";
import { z } from "astro/zod";
import { createProduct } from "@/db/dashboard/createProduct";
import { updateProduct } from "@/db/dashboard/updateProduct";
import { isAdmin } from "@/lib/auth";

function requireAdmin(locals: App.Locals) {
  if (!locals.user) {
    throw new ActionError({
      code: "UNAUTHORIZED",
      message: "You must be signed in.",
    });
  }

  if (!isAdmin(locals.user.email)) {
    throw new ActionError({
      code: "FORBIDDEN",
      message: "You do not have access.",
    });
  }

  return locals.user;
}

export const product = {
  updateProduct: defineAction({
    accept: "form",
    input: z.object({
      id: z.coerce.number(),
      name: z.string(),
      slug: z.string(),
      isActive: z.boolean(),
      isFeatured: z.boolean(),
      importantNote: z.string().nullable(),
      price: z.coerce.number(),
      discountedPrice: z.coerce.number().nullable(),
      categoryId: z.coerce.number(),
      description: z.string().nullable(),
    }),
    handler: async (input) => {
      return await updateProduct({
        id: input.id,
        isActive: input.isActive,
        isFeatured: input.isFeatured,
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
  createProduct: defineAction({
    accept: "form",
    input: z.object({
      name: z.string(),
      slug: z.string(),
      categoryId: z.coerce.number(),
      price: z.coerce.number(),
      discountedPrice: z.coerce.number(),
    }),
    handler: async (input) => {
      return await createProduct({
        isActive: true,
        isFeatured: false,
        name: input.name,
        slug: input.slug,
        categoryId: input.categoryId,
        price: input.price,
        discountedPrice: input.discountedPrice,
        description: null,
        importantNote: null,
      });
    },
  }),
};
