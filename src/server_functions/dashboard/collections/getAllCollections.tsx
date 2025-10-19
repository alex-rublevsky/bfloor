import { createServerFn } from "@tanstack/react-start";
import { DB } from "~/db";
import { collections } from "~/schema";

export const getAllCollections = createServerFn({ method: "GET" }).handler(
	async () => {
		try {
			const db = DB();

			// Fetch all collections
			const allCollections = await db.select().from(collections);

			return allCollections;
		} catch (error) {
			console.error("Error fetching collections:", error);
			throw new Error("Failed to fetch collections");
		}
	},
);
