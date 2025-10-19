import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { DB } from "~/db";
import { storeLocations } from "~/schema";

interface StoreLocationFormData {
	address: string;
	description: string;
	openingHours: string;
	isActive: boolean;
}

export const createStoreLocation = createServerFn({ method: "POST" })
	.inputValidator((data: { data: StoreLocationFormData }) => data)
	.handler(async ({ data }) => {
		try {
			const db = DB();
			const { address, description, openingHours, isActive } = data.data;

			if (!address) {
				setResponseStatus(400);
				throw new Error("Address is required");
			}

			const [inserted] = await db
				.insert(storeLocations)
				.values({
					address,
					description,
					openingHours,
					isActive,
					createdAt: new Date(),
				})
				.returning();

			return { message: "Store location created", storeLocation: inserted };
		} catch (error) {
			console.error("Error creating store location:", error);
			setResponseStatus(500);
			throw new Error("Failed to create store location");
		}
	});
