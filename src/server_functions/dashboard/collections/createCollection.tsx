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

export const createCollection = createServerFn({ method: "POST" })
	.inputValidator((data: { data: CollectionFormData }) => data)
	.handler(async ({ data }) => {
		try {
			const db = DB();
			const collectionData = data.data;

			if (
				!collectionData.name ||
				!collectionData.slug ||
				!collectionData.brandSlug
			) {
				setResponseStatus(400);
				throw new Error(
					"Missing required fields: name, slug, and brandSlug are required",
				);
			}

			// Check for duplicate slug
			const duplicateSlug = await db
				.select()
				.from(collections)
				.where(eq(collections.slug, collectionData.slug))
				.limit(1);

			if (duplicateSlug[0]) {
				setResponseStatus(400);
				throw new Error("A collection with this slug already exists");
			}

			// Insert collection
			const insertedCollections = await db
				.insert(collections)
				.values({
					name: collectionData.name,
					slug: collectionData.slug,
					brandSlug: collectionData.brandSlug,
					isActive: collectionData.isActive,
				})
				.returning();

			return {
				message: "Коллекция создана успешно!",
				collection: insertedCollections[0],
			};
		} catch (error) {
			console.error("Error creating collection:", error);
			setResponseStatus(500);
			throw new Error("Failed to create collection");
		}
	});
