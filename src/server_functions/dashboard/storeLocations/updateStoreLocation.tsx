import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { DB } from "~/db";
import { storeLocations } from "~/schema";

interface StoreLocationFormData {
	address: string;
	description: string;
	openingHours: string;
	isActive: boolean;
}

export const updateStoreLocation = createServerFn({ method: "POST" })
	.inputValidator((data: { id: number; data: StoreLocationFormData }) => data)
	.handler(async ({ data }) => {
		try {
			const db = DB();
			const { id, data: form } = data;

			if (Number.isNaN(id)) {
				setResponseStatus(400);
				throw new Error("Invalid store location ID");
			}

			if (!form.address) {
				setResponseStatus(400);
				throw new Error("Address is required");
			}

			await db
				.update(storeLocations)
				.set({
					address: form.address,
					description: form.description,
					openingHours: form.openingHours,
					isActive: form.isActive,
				})
				.where(eq(storeLocations.id, id));

			const [updated] = await db
				.select()
				.from(storeLocations)
				.where(eq(storeLocations.id, id))
				.limit(1);

			return { message: "Store location updated", storeLocation: updated };
		} catch (error) {
			console.error("Error updating store location:", error);
			setResponseStatus(500);
			throw new Error("Failed to update store location");
		}
	});
