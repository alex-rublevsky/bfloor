import type { CartItem } from "~/lib/cartContext";
import type { Product, ProductWithVariations } from "~/types";

export interface StockValidationResult {
	isAvailable: boolean;
	availableStock: number;
	unlimitedStock: boolean;
	error?: string;
}

/**
 * Calculates total quantity of a product/variation in cart, excluding the current item being validated
 */
function getCartQuantity(
	cartItems: CartItem[],
	productId: number,
	variationId?: number,
	excludeCurrentItem: boolean = false,
): number {
	return cartItems
		.filter((item) => {
			const isMatch =
				item.productId === productId && item.variationId === variationId;
			// If we're excluding the current item, return false for the first match
			if (excludeCurrentItem && isMatch) {
				excludeCurrentItem = false; // Only exclude one item
				return false;
			}
			return isMatch;
		})
		.reduce((total, item) => total + item.quantity, 0);
}

/**
 * Calculates available quantity for a variation, considering weight-based products
 */
export function getAvailableQuantityForVariation(
	product: ProductWithVariations,
	variationId: number | undefined,
	cartItems: CartItem[],
	excludeCurrentItem: boolean = false,
): number {
	// Sticker category products are always available (no stock tracking)
	if (product.categorySlug === "stickers") {
		return Number.MAX_SAFE_INTEGER;
	}

	// Handle unlimited stock products
	if (product.unlimitedStock) {
		return Number.MAX_SAFE_INTEGER;
	}

	// Handle weight-based products with variations
	if (product.weight && variationId) {
		const variation = product.variations?.find((v) => v.id === variationId);
		if (!variation) {
			return 0;
		}

		const weightAttr = variation.attributes.find(
			(attr) => attr.attributeId === "WEIGHT_G",
		);
		if (!weightAttr) {
			return 0;
		}

		const totalWeight = parseInt(product.weight || "0", 10);
		const variationWeight = parseInt(weightAttr.value, 10);

		// Calculate total weight used by other variations, excluding the current item if specified
		const otherVariationsWeight = cartItems
			.filter((item) => {
				const isOtherVariation =
					item.productId === product.id &&
					item.attributes?.WEIGHT_G &&
					// If this is the item being validated and we should exclude it, skip it
					!(excludeCurrentItem && item.variationId === variationId);

				return isOtherVariation;
			})
			.reduce((total, item) => {
				const weightG = item.attributes?.WEIGHT_G;
				return total + (weightG ? parseInt(weightG, 10) * item.quantity : 0);
			}, 0);

		const availableWeight = totalWeight - otherVariationsWeight;
		return Math.max(0, Math.floor(availableWeight / variationWeight));
	}

	// Handle regular variations or base products
	const stockToCheck = variationId
		? product.variations?.find((v) => v.id === variationId)?.stock
		: product.stock;

	if (typeof stockToCheck !== "number") {
		return 0;
	}

	const cartQuantity = getCartQuantity(
		cartItems,
		product.id,
		variationId,
		excludeCurrentItem,
	);
	return Math.max(0, stockToCheck - cartQuantity);
}

/**
 * Validates stock availability for both regular and weight-based products
 */
export function validateStock(
	products: ProductWithVariations[],
	cartItems: CartItem[],
	productId: number,
	requestedQuantity: number = 1,
	variationId?: number,
	isExistingCartItem: boolean = false,
): StockValidationResult {
	// Find the product
	const product = products.find((p) => p.id === productId);
	if (!product) {
		return {
			isAvailable: false,
			availableStock: 0,
			unlimitedStock: false,
			error: `Product not found: ${productId}`,
		};
	}

	// Handle unlimited stock products
	if (product.unlimitedStock) {
		return {
			isAvailable: true,
			availableStock: Number.MAX_SAFE_INTEGER,
			unlimitedStock: true,
		};
	}

	// Sticker category products are always available (no stock tracking)
	if (product.categorySlug === "stickers") {
		return {
			isAvailable: true,
			availableStock: Number.MAX_SAFE_INTEGER,
			unlimitedStock: true,
		};
	}

	// Calculate available quantity using our helper
	const availableStock = getAvailableQuantityForVariation(
		product,
		variationId,
		cartItems,
		isExistingCartItem,
	);

	return {
		isAvailable: availableStock >= requestedQuantity,
		availableStock,
		unlimitedStock: false,
		error:
			availableStock >= requestedQuantity
				? undefined
				: `Insufficient stock. Available: ${availableStock}, Requested: ${requestedQuantity}`,
	};
}

/**
 * Validates a specific variation exists and is valid for a product
 */
export function validateVariation(
	product: ProductWithVariations,
	variationId: number | undefined,
): { isValid: boolean; error?: string } {
	// Check if product requires variations
	if (product.hasVariations && !variationId) {
		return {
			isValid: false,
			error: `Variation required for product: ${product.name}`,
		};
	}

	if (!product.hasVariations && variationId) {
		return {
			isValid: false,
			error: `Product does not support variations: ${product.name}`,
		};
	}

	// If variation is required, validate it exists
	if (variationId) {
		const variation = product.variations?.find((v) => v.id === variationId);
		if (!variation) {
			return {
				isValid: false,
				error: `Variation not found for product: ${product.name}`,
			};
		}
	}

	return { isValid: true };
}

// === ENHANCED STOCK DETECTION FUNCTIONS FOR UI ===

/**
 * Enhanced stock detection that properly handles:
 * - Products with variations (check if ANY variation has stock)
 * - Sticker category products (always available)
 * - Weight-based products
 * - Unlimited stock products
 * - Cart context for precise availability
 */
export function isProductAvailable(
	product: Product | ProductWithVariations,
	cartItems: CartItem[] = [],
): boolean {
	// Sticker category products are always available (no stock tracking)
	if (product.categorySlug === "stickers") {
		return true;
	}

	// Unlimited stock products are always available
	if (product.unlimitedStock) {
		return true;
	}

	// Check if product has variations
	const productWithVariations = product as ProductWithVariations;
	if (
		product.hasVariations &&
		productWithVariations.variations &&
		productWithVariations.variations.length > 0
	) {
		// For products with variations, check if ANY variation has stock available
		return productWithVariations.variations.some((variation) => {
			const availableStock = getAvailableQuantityForVariation(
				productWithVariations,
				variation.id,
				cartItems,
			);
			return availableStock > 0;
		});
	}

	// For regular products without variations, check base stock with cart consideration
	const availableStock = getAvailableQuantityForVariation(
		productWithVariations,
		undefined,
		cartItems,
	);
	return availableStock > 0;
}

/**
 * Get effective stock count for display purposes
 */
export function getEffectiveStock(
	product: Product | ProductWithVariations,
	cartItems: CartItem[] = [],
): number {
	// Sticker category products show as unlimited
	if (product.categorySlug === "stickers") {
		return Number.MAX_SAFE_INTEGER;
	}

	// Unlimited stock products
	if (product.unlimitedStock) {
		return Number.MAX_SAFE_INTEGER;
	}

	// Check if product has variations
	const productWithVariations = product as ProductWithVariations;
	if (
		product.hasVariations &&
		productWithVariations.variations &&
		productWithVariations.variations.length > 0
	) {
		// For products with variations, return sum of all variation available stock
		return productWithVariations.variations.reduce((total, variation) => {
			const availableStock = getAvailableQuantityForVariation(
				productWithVariations,
				variation.id,
				cartItems,
			);
			return total + availableStock;
		}, 0);
	}

	// For regular products without variations, return available stock considering cart
	return getAvailableQuantityForVariation(
		productWithVariations,
		undefined,
		cartItems,
	);
}

/**
 * Get stock display text for UI
 */
export function getStockDisplayText(
	product: Product | ProductWithVariations,
	cartItems: CartItem[] = [],
): string {
	// Sticker category products
	if (product.categorySlug === "stickers") {
		return "Always Available";
	}

	// Unlimited stock products
	if (product.unlimitedStock) {
		return "Unlimited";
	}

	const effectiveStock = getEffectiveStock(product, cartItems);

	if (effectiveStock === 0) {
		return "Out of Stock";
	}

	// Check if product has variations
	const productWithVariations = product as ProductWithVariations;
	if (
		product.hasVariations &&
		productWithVariations.variations &&
		productWithVariations.variations.length > 0
	) {
		return `${effectiveStock} (across variations)`;
	}

	return effectiveStock.toString();
}

/**
 * Check if a product should be displayed with out-of-stock styling
 */
export function shouldShowAsOutOfStock(
	product: Product | ProductWithVariations,
	cartItems: CartItem[] = [],
): boolean {
	return !isProductAvailable(product, cartItems);
}

/**
 * Sort products with enhanced stock logic:
 * 1. Available products first (including stickers and unlimited stock)
 * 2. Out of stock products last
 * 3. Within each group, sort alphabetically by name
 */
export function sortProductsByStockAndName(
	a: Product | ProductWithVariations,
	b: Product | ProductWithVariations,
	cartItems: CartItem[] = [],
): number {
	const aAvailable = isProductAvailable(a, cartItems);
	const bAvailable = isProductAvailable(b, cartItems);

	// Sort available products first, unavailable last
	if (aAvailable && !bAvailable) return -1;
	if (!aAvailable && bAvailable) return 1;

	// Within the same availability group, sort alphabetically by name
	return a.name.localeCompare(b.name);
}
