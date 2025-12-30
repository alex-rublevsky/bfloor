import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { DB } from "~/db";
import { countries } from "~/schema";
import type { CountryFormData } from "~/types";

export const createCountry = createServerFn({ method: "POST" })
	.inputValidator((data: CountryFormData) => data)
	.handler(async ({ data }) => {
		try {
			const db = DB();
			const countryData = data;

			if (!countryData.name || !countryData.code) {
				setResponseStatus(400);
				throw new Error("Missing required fields: name and code are required");
			}

			// Check for duplicate code
			const existingCountry = await db
				.select({ code: countries.code })
				.from(countries)
				.where(eq(countries.code, countryData.code))
				.limit(1);

			if (existingCountry.length > 0) {
				setResponseStatus(409);
				throw new Error("A country with this code already exists");
			}

			// Insert the country
			const insertResult = await db
				.insert(countries)
				.values({
					name: countryData.name,
					code: countryData.code,
					flagImage: countryData.flagImage || null,
					isActive: countryData.isActive ?? true,
				})
				.returning();

			return {
				message: "Country created successfully",
				country: insertResult[0],
			};
		} catch (error) {
			console.error("Error creating country:", error);
			setResponseStatus(500);
			throw new Error("Failed to create country");
		}
	});
