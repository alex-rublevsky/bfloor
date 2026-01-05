import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { DB } from "~/db";
import { countries } from "~/schema";
import type { CountryFormData } from "~/types";
import { moveSingleStagingImage } from "../store/moveStagingImages";

export const updateCountry = createServerFn({ method: "POST" })
	.inputValidator((data: { id: number; data: CountryFormData }) => data)
	.handler(async ({ data }) => {
		try {
			const db = DB();
			const { id, data: countryData } = data;

			if (!countryData.name || !countryData.code) {
				setResponseStatus(400);
				throw new Error("Missing required fields: name and code are required");
			}

			// Check for duplicate code (excluding current country)
			const existingCountry = await db
				.select({ code: countries.code })
				.from(countries)
				.where(eq(countries.code, countryData.code))
				.limit(1);

			if (existingCountry.length > 0) {
				// Check if it's the same country (same ID)
				const currentCountry = await db
					.select({ id: countries.id })
					.from(countries)
					.where(eq(countries.id, id))
					.limit(1);

				if (currentCountry.length === 0) {
					setResponseStatus(404);
					throw new Error("Country not found");
				}

				if (existingCountry[0].code !== countryData.code) {
					setResponseStatus(409);
					throw new Error("A country with this code already exists");
				}
			}

			// Move staging images to final location before saving
			const finalFlagImage = await moveSingleStagingImage(
				countryData.flagImage,
				{
					finalFolder: "country-flags",
					slug: countryData.code,
					productName: countryData.name,
				},
			);

			// Update the country
			const updateResult = await db
				.update(countries)
				.set({
					name: countryData.name,
					code: countryData.code,
					flagImage: finalFlagImage || null,
					isActive: countryData.isActive ?? true,
				})
				.where(eq(countries.id, id))
				.returning();

			if (updateResult.length === 0) {
				setResponseStatus(404);
				throw new Error("Country not found");
			}

			return {
				message: "Country updated successfully",
				country: updateResult[0],
			};
		} catch (error) {
			console.error("Error updating country:", error);
			setResponseStatus(500);
			throw new Error("Failed to update country");
		}
	});
