import { db } from "@/db/index";
import type { StorefrontProduct } from "./types";

export async function getAllProductsByCategory(
  categoryId?: number,
): Promise<StorefrontProduct[] | null> {
  if (!categoryId) return null;

  const products = await db.query.products.findMany({
    where: {
      categoryId: categoryId,
    },
    with: {
      variations: {
        columns: {
          id: true,
          price: true,
          discountedPrice: true,
        },
        where: {
          price: { gt: 0 },
        },
        orderBy: (variation, { asc }) => [
          asc(variation.price),
          asc(variation.id),
        ],
        limit: 1,
      },
      category: { columns: { name: true, slug: true } },
      brand: {
        columns: { name: true, slug: true, image: true, countryId: true },
      },
      collection: { columns: { name: true, slug: true } },
      storeLocations: { columns: { storeLocationId: true } },
    },
    orderBy: {
      viewCount: "desc",
    },
  });

  return products.map((product) => {
    const cheapestVariation = product.variations[0];
    const hasVariations = Boolean(cheapestVariation);

    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      categoryId: product.categoryId,
      brandId: product.brandId,
      collectionId: product.collectionId,
      price: cheapestVariation?.price ?? product.price,
      discountedPrice:
        cheapestVariation?.discountedPrice ?? product.discountedPrice,
      hasVariations,
      description: product.description,
      importantNote: product.importantNote,
      images: product.images,
      updatedAt: product.updatedAt,
      category: product.category,
      brand: product.brand,
      collection: product.collection,
      storeLocations: product.storeLocations.map(
        ({ storeLocationId }) => storeLocationId,
      ),
    };
  });
}
