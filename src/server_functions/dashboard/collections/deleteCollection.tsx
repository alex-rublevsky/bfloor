import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { DB } from "~/db";
import { collections } from "~/schema";

export const deleteCollection = createServerFn({ method: "POST" })
	.inputValidator((data: { data: { id: number } }) => data)
	.handler(async ({ data }) => {
		try {
			const db = DB();
			const { id: collectionId } = data.data;

			if (Number.isNaN(collectionId)) {
				setResponseStatus(400);
				throw new Error("Invalid collection ID");
			}

			// Check if collection exists
			const existingCollection = await db
				.select()
				.from(collections)
				.where(eq(collections.id, collectionId))
				.limit(1);

			if (!existingCollection[0]) {
				setResponseStatus(404);
				throw new Error("Коллекция не найдена");
			}

			// Delete collection
			await db.delete(collections).where(eq(collections.id, collectionId));

			return {
				message: "Коллекция удалена успешно!",
			};
		} catch (error) {
			console.error("Error deleting collection:", error);
			setResponseStatus(500);
			throw new Error("Failed to delete collection");
		}
	});


