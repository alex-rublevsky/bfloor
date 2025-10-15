import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { DB } from "~/db";
import { addresses, orderItems, orders, products, type schema } from "~/schema";

export const getOrderBySlug = createServerFn({ method: "GET" })
	.inputValidator((data: { orderId: string }) => data)
	.handler(async ({ data }) => {
		try {
			const db: DrizzleD1Database<typeof schema> = DB();
			const { orderId } = data;
			const orderIdNum = parseInt(orderId, 10);

			if (Number.isNaN(orderIdNum)) {
				setResponseStatus(400);
				throw new Error("Invalid order ID");
			}

			// Fetch order with all related data
			const [orderResult, itemsResult, addressesResult] = await Promise.all([
				// Get the order
				db
					.select()
					.from(orders)
					.where(eq(orders.id, orderIdNum))
					.limit(1),

				// Get order items with product data
				db
					.select({
						// Order item fields
						id: orderItems.id,
						orderId: orderItems.orderId,
						productId: orderItems.productId,
						productVariationId: orderItems.productVariationId,
						quantity: orderItems.quantity,
						unitAmount: orderItems.unitAmount,
						discountPercentage: orderItems.discountPercentage,
						finalAmount: orderItems.finalAmount,
						attributes: orderItems.attributes,
						createdAt: orderItems.createdAt,

						// Product fields
						product: {
							id: products.id,
							name: products.name,
							slug: products.slug,
							images: products.images,
							description: products.description,
							price: products.price,
						},
					})
					.from(orderItems)
					.leftJoin(products, eq(orderItems.productId, products.id))
					.where(eq(orderItems.orderId, orderIdNum)),

				// Get addresses
				db
					.select()
					.from(addresses)
					.where(eq(addresses.orderId, orderIdNum)),
			]);

			if (!orderResult[0]) {
				setResponseStatus(404);
				throw new Error("Order not found");
			}

			const order = orderResult[0];
			const items = itemsResult.map((item) => ({
				id: item.id,
				orderId: item.orderId,
				productId: item.productId,
				productVariationId: item.productVariationId,
				quantity: item.quantity,
				unitAmount: item.unitAmount,
				discountPercentage: item.discountPercentage,
				finalAmount: item.finalAmount,
				attributes: item.attributes ? JSON.parse(item.attributes) : {},
				createdAt: item.createdAt,
				product: item.product,
			}));

			const orderWithRelations = {
				...order,
				items,
				addresses: addressesResult,
			};

			return orderWithRelations;
		} catch (error) {
			console.error("Error fetching order:", error);
			setResponseStatus(500);
			throw new Error("Failed to fetch order");
		}
	});
