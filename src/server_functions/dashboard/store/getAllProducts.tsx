import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { DB } from "~/db";
import type * as schema from "~/schema";
import {
	brands,
	categories,
	products,
	productVariations,
	variationAttributes,
} from "~/schema";
import type {
	ProductVariationWithAttributes,
	ProductWithVariations,
} from "~/types";

// Type for the joined query result
type JoinedQueryResult = {
	products: typeof products.$inferSelect;
	product_variations: typeof productVariations.$inferSelect | null;
	variation_attributes: typeof variationAttributes.$inferSelect | null;
};

export const getAllProducts = createServerFn({ method: "GET" })
	.inputValidator(() => ({}))
	.handler(async () => {
		try {
			const db: DrizzleD1Database<typeof schema> = DB();

			// Fetch all base data
			const categoriesResult = await db.select().from(categories).all();
			const brandsResult = await db.select().from(brands).all();

			// Fetch products with variations in a single complex query
			const rows: JoinedQueryResult[] = await db
				.select()
				.from(products)
				.leftJoin(
					productVariations,
					eq(productVariations.productId, products.id),
				)
				.leftJoin(
					variationAttributes,
					eq(variationAttributes.productVariationId, productVariations.id),
				)
				.all();

            // Allow empty state: don't error when there are no products yet

			// Group products and build variations
			const productMap = new Map<number, ProductWithVariations>();
			const variationMap = new Map<number, ProductVariationWithAttributes>();

            for (const row of (rows || [])) {
				const product = row.products;
				const variation = row.product_variations;
				const attribute = row.variation_attributes;

				// Initialize product if not exists
				if (!productMap.has(product.id)) {
					productMap.set(product.id, {
						...product,
						variations: [],
					});
				}

				const currentProduct = productMap.get(product.id);
				if (!currentProduct) {
					continue; // Skip if product not found in map
				}

				// Process variations if product has them
				if (variation) {
					// Initialize variation if not exists
					if (!variationMap.has(variation.id)) {
						variationMap.set(variation.id, {
							id: variation.id,
							productId: variation.productId,
							sku: variation.sku,
							price: variation.price,
							stock: variation.stock,
							sort: variation.sort,
							discount: variation.discount,
							shippingFrom: variation.shippingFrom,
							createdAt: variation.createdAt,
							attributes: [],
						});
					}

					// Add attribute to variation if exists
					if (attribute) {
						const currentVariation = variationMap.get(variation.id);
						if (!currentVariation) continue;
						const existingAttribute = currentVariation.attributes.find(
							(attr) => attr.attributeId === attribute.attributeId,
						);

						if (!existingAttribute) {
							currentVariation.attributes.push({
								attributeId: attribute.attributeId,
								value: attribute.value,
							});
						}
					}
				}
			}

			// Assign variations to products
			for (const variation of variationMap.values()) {
				const productId = rows.find(
					(row) => row.product_variations?.id === variation.id,
				)?.products.id;
				if (productId) {
					const product = productMap.get(productId);
					if (
						product &&
						!product.variations?.find((v) => v.id === variation.id)
					) {
						product.variations?.push(variation);
					}
				}
			}

			// Sort variations by sort field
			for (const product of productMap.values()) {
				product.variations?.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
			}

			// Convert to array
            const productsArray = Array.from(productMap.values());

			// Group products by category and inactive status
			interface ProductGroup {
				title: string;
				products: ProductWithVariations[];
				categorySlug?: string;
			}

			const groupedProducts: ProductGroup[] = [];
			const categoryOrder = ["products", ""]; // TODO: what is this for? update

			// Group active products by category
			const categoriesBySlug = new Map(
				categoriesResult.map((cat) => [cat.slug, cat]),
			);

			const productsByCategory = new Map<string, ProductWithVariations[]>();
			const inactive: ProductWithVariations[] = [];

			// Single pass through products to categorize them
			for (const product of productsArray) {
				if (!product.isActive) {
					inactive.push(product);
				} else if (product.categorySlug) {
					const categoryProducts =
						productsByCategory.get(product.categorySlug) || [];
					categoryProducts.push(product);
					productsByCategory.set(product.categorySlug, categoryProducts);
				}
			}

			// Add category groups in specified order
			const allCategorySlugs = Array.from(productsByCategory.keys());
			const sortedCategorySlugs = allCategorySlugs.sort((a, b) => {
				const indexA = categoryOrder.indexOf(a);
				const indexB = categoryOrder.indexOf(b);
				if (indexA !== -1 && indexB !== -1) return indexA - indexB;
				if (indexA !== -1) return -1;
				if (indexB !== -1) return 1;
				return a.localeCompare(b);
			});

			// Helper function to check if product is available (server-side, no cart context)
			const isProductAvailableServerSide = (
				product: ProductWithVariations,
			): boolean => {
				// Sticker category products are always available
				if (product.categorySlug === "stickers") {
					return true;
				}

				// Unlimited stock products are always available
				if (product.unlimitedStock) {
					return true;
				}

				// Check if product has variations
				if (
					product.hasVariations &&
					product.variations &&
					product.variations.length > 0
				) {
					// For weight-based products, check if there's total weight available
					if (product.weight) {
						const totalWeight = parseInt(product.weight || "0", 10);
						return totalWeight > 0;
					}

					// For regular variation products, check if ANY variation has stock > 0
					return product.variations.some((variation) => variation.stock > 0);
				}

				// For regular products without variations, check base stock
				return product.stock > 0;
			};

			// Sort products within each category: available first, then alphabetically
			const sortProductsByAvailability = (
				products: ProductWithVariations[],
			): ProductWithVariations[] => {
				return [...products].sort((a, b) => {
					const aAvailable = isProductAvailableServerSide(a);
					const bAvailable = isProductAvailableServerSide(b);

					// Available products first, unavailable last
					if (aAvailable !== bAvailable) {
						return aAvailable ? -1 : 1;
					}

					// Within same availability group, sort alphabetically
					return a.name.localeCompare(b.name);
				});
			};

			for (const slug of sortedCategorySlugs) {
				const products = productsByCategory.get(slug);
				if (!products) continue; // Skip if products not found
				const category = categoriesBySlug.get(slug);
				groupedProducts.push({
					title: category?.name || slug,
					products: sortProductsByAvailability(products),
					categorySlug: slug,
				});
			}

			// Add inactive group (also sorted)
            if (inactive.length > 0) {
				groupedProducts.push({
					title: "Inactive",
					products: sortProductsByAvailability(inactive),
				});
			}

			return {
				groupedProducts,
				categories: categoriesResult,
				brands: brandsResult,
			};
		} catch (error) {
			console.error("Error fetching dashboard data:", error);
			setResponseStatus(500);
			throw new Error("Failed to fetch dashboard data");
		}
	});
