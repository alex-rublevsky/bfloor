import { env } from "cloudflare:workers";
import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { DB } from "~/db";
import type * as schema from "~/schema";
import { brands, countries } from "~/schema";

export const deleteCountry = createServerFn({ method: "POST" })
	.inputValidator((data: { id: number }) => data)
	.handler(async ({ data }) => {
		try {
			const db: DrizzleD1Database<typeof schema> = DB();
			const { id } = data;

			// Check if country exists and get flag image
			const existingCountry = await db
				.select()
				.from(countries)
				.where(eq(countries.id, id))
				.limit(1);

			if (existingCountry.length === 0) {
				setResponseStatus(404);
				throw new Error("Country not found");
			}

			// Check if any brands are using this country
			const brandsUsingCountry = await db
				.select({ id: brands.id })
				.from(brands)
				.where(eq(brands.countryId, id))
				.limit(1);

			if (brandsUsingCountry.length > 0) {
				setResponseStatus(409);
				throw new Error(
					"Cannot delete country: there are brands using this country",
				);
			}

			// Delete flag image from R2 if it exists
			if (existingCountry[0].flagImage) {
				try {
					const bucket = env.BFLOOR_STORAGE as R2Bucket;
					if (bucket) {
						try {
							await bucket.delete(existingCountry[0].flagImage);
							console.log(
								`Deleted flag image: ${existingCountry[0].flagImage}`,
							);
						} catch (error) {
							// Log but don't fail if image deletion fails
							console.warn(
								`Failed to delete flag image ${existingCountry[0].flagImage}:`,
								error,
							);
						}
					}
				} catch (error) {
					// Log but don't fail if image deletion fails
					console.warn("Failed to delete flag image from R2:", error);
				}
			}

			// Delete the country
			const deleteResult = await db
				.delete(countries)
				.where(eq(countries.id, id))
				.returning();

			if (deleteResult.length === 0) {
				setResponseStatus(404);
				throw new Error("Country not found");
			}

			return {
				message: "Country deleted successfully",
			};
		} catch (error) {
			console.error("Error deleting country:", error);
			setResponseStatus(500);
			throw new Error("Failed to delete country");
		}
	});
