import { db } from "@/db/index";
import { products, storeLocations, productAttributeValues } from "@/db/schema";
import type {
  CreateProductInput,
  ProductWithRelations,
} from "@/db/dashboard/products/types";

export async function createProduct(
  product: CreateProductInput,
): Promise<ProductWithRelations> {
  return await db.transaction(async (tx) => {
    const [insertedProduct] = await tx
      .insert(products)
      .values({
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
        country: product.country,
      })
      .returning();
    if (!insertedProduct) {
      throw new Error("Product was not created");
    }
    const locationRows = product.storeLocationIds.map((storeLocationId) => ({
      productId: insertedProduct.id,
      storeLocationId,
    }));

    if (locationRows.length > 0) {
      await tx.insert(storeLocations).values(locationRows);
    }

    const attributeRows = product.productAttributeValues.map((selection) => ({
      productId: insertedProduct.id,
      attributeId: selection.attributeId,
      attributeValueId: selection.attributeValueId,
    }));

    if (attributeRows.length > 0) {
      await tx.insert(productAttributeValues).values(attributeRows);
    }

    return {
      ...insertedProduct,
      storeLocationIds: product.storeLocationIds,
      productAttributeValues: product.productAttributeValues,
    };
  });
}
