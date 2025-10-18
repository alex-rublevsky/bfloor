import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { DB } from "~/db";
import { collections } from "~/schema";

export const getCollectionBySlug = createServerFn({ method: "POST" })
	.inputValidator((data: { slug: string }) => data)
	.handler(async ({ data }) => {
		try {
			const db = DB();
			const { slug } = data;

			const collection = await db
				.select()
				.from(collections)
				.where(eq(collections.slug, slug))
				.limit(1);

			if (!collection[0]) {
				setResponseStatus(404);
				throw new Error("Коллекция не найдена");
			}

			return collection[0];
		} catch (error) {
			console.error("Error fetching collection:", error);
			setResponseStatus(500);
			throw new Error("Failed to fetch collection");
		}
	});

