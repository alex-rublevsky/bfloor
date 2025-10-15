import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { DB } from "~/db";
import type * as schema from "~/schema";
import { orderItems, orders } from "~/schema";
import type { ProductWithVariations } from "~/types";
import { validateStock, validateVariation } from "~/utils/validateStock";

// TypeScript interfaces
interface CartItem {
	productId: number;
	productName: string;
	productSlug: string;
	variationId?: number;
	quantity: number;
	addedAt: number; // From minimal CartItem
	price: number;
	maxStock: number;
	unlimitedStock: boolean;
	discount?: number | null;
	image?: string;
	attributes?: Record<string, string>;
	weightInfo?: {
		totalWeight: number;
	};
}

interface CustomerInfo {
	notes?: string;
	shippingMethod?: string;
}

interface OrderCreationRequest {
	customerInfo: CustomerInfo;
	cartItems: CartItem[];
	products: ProductWithVariations[];
}

export const createOrder = createServerFn({ method: "POST" })
	.inputValidator((data: OrderCreationRequest) => data)
	.handler(async ({ data }) => {
		try {
			const { customerInfo, cartItems, products } = data;

			// Validate required fields
			if (!cartItems || cartItems.length === 0) {
				setResponseStatus(400);
				throw new Error("Cart is empty");
			}

			if (!products || products.length === 0) {
				setResponseStatus(400);
				throw new Error("Product data is required");
			}

			// Create the order using the existing createOrder function
			const { order } = await createOrderInternal(
				customerInfo,
				cartItems,
				products,
			);

			// Small delay to ensure database transaction is fully committed
			await new Promise((resolve) => setTimeout(resolve, 2000));

			return {
				success: true,
				message: "Order created successfully",
				orderId: order.id,
			};
		} catch (error) {
			console.error("Order creation error:", error);

			let errorMessage = "Unknown error occurred";
			if (error instanceof Error) {
				if (error.message.includes("Variation not found")) {
					errorMessage =
						"Some items in your cart are no longer available with the selected options. Please refresh the page and update your cart.";
				} else if (
					error.message.includes("Email service configuration error")
				) {
					errorMessage =
						"Order was created but email notifications failed. Our team will contact you shortly.";
				} else {
					errorMessage = error.message;
				}
			}

			setResponseStatus(500);
			throw new Error(errorMessage);
		}
	});

// Internal order creation function (renamed from createOrder)
async function createOrderInternal(
	customerInfo: CustomerInfo,
	cartItems: CartItem[],
	products: ProductWithVariations[],
) {
	const db: DrizzleD1Database<typeof schema> = DB();
	// Create a map for O(1) lookups
	const productMap = new Map(products.map((p) => [p.id, p]));

	// Validate all items in one pass
	const orderAmounts = cartItems.reduce(
		(acc, item) => {
			// 1. Validate product exists
			const product = productMap.get(item.productId);
			if (!product) {
				throw new Error(`Product not found: ${item.productName}`);
			}

			// 2. Validate variation and price
			const variationValidation = validateVariation(product, item.variationId);
			if (!variationValidation.isValid) {
				throw new Error(
					variationValidation.error ||
						`Invalid variation for product: ${item.productName}`,
				);
			}

			// 3. Validate price
			const expectedPrice =
				product.hasVariations && item.variationId
					? product.variations?.find((v) => v.id === item.variationId)?.price
					: product.price;

			if (expectedPrice !== item.price) {
				throw new Error(
					`Price mismatch for ${item.productName}: Expected ${expectedPrice}, got ${item.price}`,
				);
			}

			// 4. Validate stock
			const stockValidation = validateStock(
				products,
				cartItems,
				item.productId,
				item.quantity,
				item.variationId,
				true, // This item is already in the cart
			);

			if (!stockValidation.isAvailable && !stockValidation.unlimitedStock) {
				throw new Error(
					stockValidation.error ||
						`Insufficient stock for ${item.productName}. Available: ${stockValidation.availableStock}, Requested: ${item.quantity}`,
				);
			}

			// 5. Calculate amounts
			if (item.price < 0 || item.quantity <= 0) {
				throw new Error(`Invalid price or quantity for ${item.productName}`);
			}

			const itemSubtotal = item.price * item.quantity;
			const itemDiscount =
				item.discount && item.discount > 0 && item.discount <= 100
					? itemSubtotal * (item.discount / 100)
					: 0;

			return {
				subtotalAmount: acc.subtotalAmount + itemSubtotal,
				discountAmount: acc.discountAmount + itemDiscount,
			};
		},
		{ subtotalAmount: 0, discountAmount: 0 },
	);

	const shippingAmount = 0; // Will be determined later
	const totalAmount =
		orderAmounts.subtotalAmount - orderAmounts.discountAmount + shippingAmount;

	if (totalAmount < 0) {
		throw new Error(`Invalid total amount: ${totalAmount}`);
	}

	const now = new Date();

	// Create order
	const [order] = await db
		.insert(orders)
		.values({
			subtotalAmount: orderAmounts.subtotalAmount,
			discountAmount: orderAmounts.discountAmount,
			shippingAmount,
			totalAmount,
			currency: "CAD",
			paymentStatus: "pending",
			paymentMethod: null,
			shippingMethod: customerInfo.shippingMethod ?? null,
			notes: customerInfo.notes ?? null,
			createdAt: now,
			completedAt: null,
		})
		.returning();

	// Create order items
	await db.insert(orderItems).values(
		cartItems.map((item) => ({
			orderId: order.id,
			productId: item.productId,
			productVariationId: item.variationId ?? null,
			quantity: item.quantity,
			unitAmount: item.price,
			discountPercentage: item.discount ?? null,
			finalAmount: item.discount
				? item.price * (1 - item.discount / 100) * item.quantity
				: item.price * item.quantity,
			attributes: JSON.stringify(
				item.attributes && typeof item.attributes === "object"
					? item.attributes
					: {},
			),
			createdAt: now,
		})),
	);

	return { order, orderAmounts, totalAmount };
}
