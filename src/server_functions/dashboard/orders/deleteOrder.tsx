import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { eq, inArray } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { DB } from "~/db";
import type * as schema from "~/schema";
import { orderItems, orders } from "~/schema";

export const deleteOrder = createServerFn({ method: "POST" })
	.inputValidator((data: { id: number }) => data)
	.handler(async ({ data }) => {
		try {
			const db: DrizzleD1Database<typeof schema> = DB();
			const orderId = data.id;

			if (Number.isNaN(orderId)) {
				setResponseStatus(400);
				throw new Error("Invalid order ID");
			}

			// Check if order exists
			const existingOrder = await db
				.select()
				.from(orders)
				.where(eq(orders.id, orderId))
				.limit(1);

			if (!existingOrder[0]) {
				setResponseStatus(404);
				throw new Error("Order not found");
			}

			// Delete related data first (foreign key constraints)
			// Delete order items
			await db.delete(orderItems).where(eq(orderItems.orderId, orderId));

			// Finally delete the order
			await db.delete(orders).where(eq(orders.id, orderId));

			return {
				message: "Order deleted successfully",
			};
		} catch (error) {
			console.error("Error deleting order:", error);
			setResponseStatus(500);
			throw new Error("Failed to delete order");
		}
	});

export const deleteOrders = createServerFn({ method: "POST" })
	.inputValidator((data: { ids: number[] }) => data)
	.handler(async ({ data }) => {
		try {
			const db: DrizzleD1Database<typeof schema> = DB();
			const orderIds = data.ids;

			if (!Array.isArray(orderIds) || orderIds.length === 0) {
				setResponseStatus(400);
				throw new Error("Invalid order IDs");
			}

			// Validate all IDs are numbers
			const validIds = orderIds.filter((id) => !Number.isNaN(id));
			if (validIds.length !== orderIds.length) {
				setResponseStatus(400);
				throw new Error("Some order IDs are invalid");
			}

			// Check if all orders exist
			const existingOrders = await db
				.select({ id: orders.id })
				.from(orders)
				.where(inArray(orders.id, orderIds));

			if (existingOrders.length !== orderIds.length) {
				setResponseStatus(404);
				throw new Error("Some orders not found");
			}

			// Delete related data first (foreign key constraints)
			// Delete order items
			await db.delete(orderItems).where(inArray(orderItems.orderId, orderIds));

			// Finally delete the orders
			await db.delete(orders).where(inArray(orders.id, orderIds));

			return {
				message: `${orderIds.length} order(s) deleted successfully`,
				deletedCount: orderIds.length,
			};
		} catch (error) {
			console.error("Error deleting orders:", error);
			setResponseStatus(500);
			throw new Error("Failed to delete orders");
		}
	});
