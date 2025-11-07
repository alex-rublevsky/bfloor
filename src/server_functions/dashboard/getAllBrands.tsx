import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { DB } from "~/db";
import type * as schema from "~/schema";
import { brands, countries } from "~/schema";

export const getAllBrands = createServerFn({ method: "GET" }).handler(
	async () => {
		try {
			const db: DrizzleD1Database<typeof schema> = DB();
			// Join with countries to get flag image
			const brandsResult = await db
				.select({
					id: brands.id,
					name: brands.name,
					slug: brands.slug,
					image: brands.image,
					countryId: brands.countryId,
					isActive: brands.isActive,
					countryFlagImage: countries.flagImage,
				})
				.from(brands)
				.leftJoin(countries, eq(brands.countryId, countries.id))
				.all();

			// Return empty array if no brands found instead of throwing error
			return brandsResult || [];
		} catch (error) {
			console.error("Error fetching dashboard brands data:", error);
			setResponseStatus(500);
			throw new Error("Failed to fetch dashboard brands data");
		}
	},
);
