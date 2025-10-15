import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { DB } from "~/db";
import type * as schema from "~/schema";
import {
	orderItems,
	orders,
	products,
	productVariations,
} from "~/schema";

export const getAllOrders = createServerFn({ method: "GET" }).handler(
	async () => {
		try {
			const db: DrizzleD1Database<typeof schema> = DB();

			// Fetch all orders
			const ordersResult = await db.select().from(orders).all();

			if (!ordersResult || ordersResult.length === 0) {
				return { groupedOrders: [] };
			}

			// Fetch all related data for all orders in parallel
			const ordersWithRelations = await Promise.all(
				ordersResult.map(async (order) => {
					const itemsResult = await db
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
							productName: products.name,
							productImages: products.images,

							// Variation fields
							variationId: productVariations.id,
							variationSku: productVariations.sku,
						})
						.from(orderItems)
						.leftJoin(products, eq(orderItems.productId, products.id))
						.leftJoin(
							productVariations,
							eq(orderItems.productVariationId, productVariations.id),
						)
						.where(eq(orderItems.orderId, order.id));

					// Transform items to match expected structure
					const items = itemsResult.map((item) => ({
						id: item.id,
						orderId: item.orderId,
						productId: item.productId,
						quantity: item.quantity,
						unitAmount: item.unitAmount,
						discountPercentage: item.discountPercentage,
						finalAmount: item.finalAmount,
						attributes: item.attributes ? JSON.parse(item.attributes) : {},
						product: {
							name: item.productName || "Unknown Product",
							images: item.productImages,
						},
						variation: item.variationId
							? {
									id: item.variationId,
									sku: item.variationSku || "",
								}
							: undefined,
					}));

					return {
						...order,
						items,
					};
				}),
			);

			// Group orders by status
			interface OrderGroup {
				title: string;
				orders: typeof ordersWithRelations;
			}

			const groupedOrders: OrderGroup[] = [];

			// Separate orders by status
			const newOrders = ordersWithRelations.filter(
				(order) => order.status === "pending",
			);
			const processedOrders = ordersWithRelations.filter(
				(order) => order.status === "processed",
			);

			// Sort by date (newest first) within each group
			const sortByDate = (
				a: (typeof ordersWithRelations)[0],
				b: (typeof ordersWithRelations)[0],
			) => {
				return (
					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
				);
			};

			// Add groups with sorted orders
			if (newOrders.length > 0) {
				groupedOrders.push({
					title: "New",
					orders: newOrders.sort(sortByDate),
				});
			}

			if (processedOrders.length > 0) {
				groupedOrders.push({
					title: "Processed",
					orders: processedOrders.sort(sortByDate),
				});
			}

			return { groupedOrders };
		} catch (error) {
			console.error("Error fetching dashboard orders data:", error);
			setResponseStatus(500);
			throw new Error("Failed to fetch dashboard orders data");
		}
	},
);
