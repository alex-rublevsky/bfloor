import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { DB } from "~/db";
import { collections } from "~/schema";

interface CollectionFormData {
	name: string;
	slug: string;
	brandSlug: string;
	isActive: boolean;
}

export const updateCollection = createServerFn({ method: "POST" })
	.inputValidator((data: { id: number; data: CollectionFormData }) => data)
	.handler(async ({ data }) => {
		try {
			const db = DB();
			const { id: collectionId, data: collectionData } = data;

			if (Number.isNaN(collectionId)) {
				setResponseStatus(400);
				throw new Error("Invalid collection ID");
			}

			if (!collectionData.name || !collectionData.slug || !collectionData.brandSlug) {
				setResponseStatus(400);
				throw new Error("Missing required fields: name, slug, and brandSlug are required");
			}

			// Check if collection exists and for duplicate slug
			const [existingCollection, duplicateSlug] = await Promise.all([
				db
					.select()
					.from(collections)
					.where(eq(collections.id, collectionId))
					.limit(1),
				db
					.select()
					.from(collections)
					.where(eq(collections.slug, collectionData.slug))
					.limit(1),
			]);

			if (!existingCollection[0]) {
				setResponseStatus(404);
				throw new Error("Коллекция не найдена");
			}

			if (duplicateSlug[0] && duplicateSlug[0].id !== collectionId) {
				setResponseStatus(400);
				throw new Error("A collection with this slug already exists");
			}

			// Update collection
			await db
				.update(collections)
				.set({
					name: collectionData.name,
					slug: collectionData.slug,
					brandSlug: collectionData.brandSlug,
					isActive: collectionData.isActive,
				})
				.where(eq(collections.id, collectionId));

			// Fetch and return updated collection
			const updatedCollection = await db
				.select()
				.from(collections)
				.where(eq(collections.id, collectionId))
				.limit(1);

			return {
				message: "Коллекция обновлена успешно!",
				collection: updatedCollection[0],
			};
		} catch (error) {
			console.error("Error updating collection:", error);
			setResponseStatus(500);
			throw new Error("Failed to update collection");
		}
	});
