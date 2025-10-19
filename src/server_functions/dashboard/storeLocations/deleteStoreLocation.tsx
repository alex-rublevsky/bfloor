import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { DB } from "~/db";
import { storeLocations } from "~/schema";

export const deleteStoreLocation = createServerFn({ method: "POST" })
	.inputValidator((data: { data: { id: number } }) => data)
	.handler(async ({ data }) => {
		try {
			const db = DB();
			const { id } = data.data;

			if (Number.isNaN(id)) {
				setResponseStatus(400);
				throw new Error("Invalid store location ID");
			}

			const [existing] = await db
				.select()
				.from(storeLocations)
				.where(eq(storeLocations.id, id))
				.limit(1);

			if (!existing) {
				setResponseStatus(404);
				throw new Error("Store location not found");
			}

			await db.delete(storeLocations).where(eq(storeLocations.id, id));

			return { message: "Store location deleted" };
		} catch (error) {
			console.error("Error deleting store location:", error);
			setResponseStatus(500);
			throw new Error("Failed to delete store location");
		}
	});
