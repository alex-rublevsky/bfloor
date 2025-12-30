import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { DB } from "~/db";
import { orders } from "~/schema";

export const updateOrderStatus = createServerFn({ method: "POST" })
	.inputValidator((data: { id: number; status: string }) => data)
	.handler(async ({ data }) => {
		try {
			const db = DB();
			const { id: orderId, status } = data;

			if (Number.isNaN(orderId)) {
				setResponseStatus(400);
				throw new Error("Invalid order ID");
			}

			if (!status) {
				setResponseStatus(400);
				throw new Error("Status is required");
			}

			// Validate status
			const validStatuses = [
				"pending",
				"processed",
				"shipped",
				"delivered",
				"cancelled",
			];
			if (!validStatuses.includes(status)) {
				setResponseStatus(400);
				throw new Error(
					`Invalid status. Must be one of: ${validStatuses.join(", ")}`,
				);
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

			// Update order status
			const updateData: { status: string; completedAt?: Date } = { status };

			// If marking as processed and not already completed, set completedAt
			if (status === "processed" && !existingOrder[0].completedAt) {
				updateData.completedAt = new Date();
			}

			await db.update(orders).set(updateData).where(eq(orders.id, orderId));

			// Fetch and return updated order
			const updatedOrder = await db
				.select()
				.from(orders)
				.where(eq(orders.id, orderId))
				.limit(1);

			return {
				success: true,
				message: "Order status updated successfully",
				order: updatedOrder[0],
			};
		} catch (error) {
			console.error("Error updating order status:", error);
			setResponseStatus(500);
			throw new Error(
				error instanceof Error
					? error.message
					: "Failed to update order status",
			);
		}
	});
