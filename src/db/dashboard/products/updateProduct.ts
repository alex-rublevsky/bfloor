import { db } from "@/db/index";
import { products, storeLocations, productAttributeValues } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import type {
  ProductWithRelations,
  UpdateProductInput,
} from "@/db/dashboard/products/types";

export async function bulkUpdateProducts(input: {
  ids: number[];
  changes: {
    price?: number | null;
    discountedPrice?: number | null;
  };
}) {
  return await db.transaction(async (tx) => {
    if (Object.keys(input.changes).length > 0) {
      await tx
        .update(products)
        .set(input.changes)
        .where(inArray(products.id, input.ids));
    }

    // if (input.storeLocationIds !== undefined) {
    //   await tx
    //     .delete(storeLocations)
    //     .where(inArray(storeLocations.productId, input.ids));
    //   if (input.storeLocationIds.length > 0) {
    //     await tx
    //       .insert(storeLocations)
    //       .values(
    //         input.ids.flatMap((productId) =>
    //           input.storeLocationIds!.map((storeLocationId) => ({
    //             productId,
    //             storeLocationId,
    //           })),
    //         ),
    //       );
    //   }
    // }
  });
}

//TODO: is it appropriate to have UpdateProductInput as a return type?
// same for the createProduct function
export async function updateProduct(
  product: UpdateProductInput,
): Promise<ProductWithRelations> {
  return await db.transaction(async (tx) => {
    const [updatedProduct] = await tx
      .update(products)
      .set({
        isActive: product.isActive,
        slug: product.slug,
        sku: product.sku,
        name: product.name,
        images: product.images,
        categoryId: product.categoryId,
        brandId: product.brandId,
        collectionId: product.collectionId,
        price: product.price,
        discountedPrice: product.discountedPrice,
        description: product.description,
        importantNote: product.importantNote,
        unitOfMeasurement: product.unitOfMeasurement,
        squareMetersPerPack: product.squareMetersPerPack,
        dimensions: product.dimensions,
      })
      .where(eq(products.id, product.id))
      .returning();

    if (!updatedProduct) {
      throw new Error("Product was not found");
    }

    await tx
      .delete(storeLocations)
      .where(eq(storeLocations.productId, product.id));

    const locationRows = product.storeLocationIds.map((storeLocationId) => ({
      productId: product.id,
      storeLocationId,
    }));

    if (locationRows.length > 0) {
      await tx.insert(storeLocations).values(locationRows);
    }

    await tx
      .delete(productAttributeValues)
      .where(eq(productAttributeValues.productId, product.id));

    const attributeRows = product.productAttributeValues.map((selection) => ({
      productId: updatedProduct.id,
      attributeId: selection.attributeId,
      attributeValueId: selection.attributeValueId,
    }));

    if (attributeRows.length > 0) {
      await tx.insert(productAttributeValues).values(attributeRows);
    }

    return {
      ...updatedProduct,
      storeLocationIds: product.storeLocationIds,
      productAttributeValues: product.productAttributeValues,
    };
  });
}
