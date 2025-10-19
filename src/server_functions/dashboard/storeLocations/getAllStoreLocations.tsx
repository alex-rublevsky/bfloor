import { createServerFn } from "@tanstack/react-start";
import { DB } from "~/db";
import { storeLocations } from "~/schema";

export const getAllStoreLocations = createServerFn({ method: "GET" }).handler(
	async () => {
		const db = DB();
		const rows = await db.select().from(storeLocations);
		return rows;
	},
);
