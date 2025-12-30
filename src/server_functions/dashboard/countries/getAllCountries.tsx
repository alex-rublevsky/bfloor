import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { asc, eq } from "drizzle-orm";
import { DB } from "~/db";
import { countries } from "~/schema";

export const getAllCountries = createServerFn({ method: "GET" }).handler(
	async () => {
		try {
			const db = DB();
			const countriesResult = await db
				.select()
				.from(countries)
				.where(eq(countries.isActive, true))
				.orderBy(asc(countries.name))
				.all();

			// Return empty array if no countries found instead of throwing error
			return countriesResult || [];
		} catch (error) {
			console.error("Error fetching countries:", error);
			setResponseStatus(500);
			throw new Error("Failed to fetch countries");
		}
	},
);

// Get all countries (including inactive) for dashboard management
export const getAllCountriesForDashboard = createServerFn({
	method: "GET",
}).handler(async () => {
	try {
		const db = DB();
		const countriesResult = await db
			.select()
			.from(countries)
			.orderBy(asc(countries.name))
			.all();

		// Always return an array - empty array if no countries found
		// This ensures the query succeeds even when the table is empty
		return Array.isArray(countriesResult) ? countriesResult : [];
	} catch (error) {
		console.error("Error fetching countries for dashboard:", error);
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		const errorDetails = error instanceof Error ? error.stack : String(error);
		console.error("Error details:", errorDetails);

		// Check if the error is due to table not existing
		// In SQLite/D1, this typically shows as "no such table" or "Failed query"
		const errorString = String(errorMessage).toLowerCase();
		if (
			errorString.includes("no such table") ||
			errorString.includes("failed query") ||
			(errorString.includes("table") && errorString.includes("not exist"))
		) {
			// Table doesn't exist yet - return empty array instead of error
			// This allows the UI to show empty state while migrations are pending
			console.warn(
				"Countries table does not exist yet. Returning empty array. Run migrations to create the table.",
			);
			return [];
		}

		// For other errors, throw as before
		setResponseStatus(500);
		throw new Error(`Failed to fetch countries for dashboard: ${errorMessage}`);
	}
});
