import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { getCountryById } from "~/data/countries";
import { DB } from "~/db";
import { brands } from "~/schema";

export const getAllBrands = createServerFn({ method: "GET" }).handler(
	async () => {
		try {
			const db = DB();
			// Get brands from database
			const brandsResult = await db
				.select({
					id: brands.id,
					name: brands.name,
					slug: brands.slug,
					image: brands.image,
					countryId: brands.countryId,
					isActive: brands.isActive,
				})
				.from(brands)
				.all();

			// Map brands with country flag from hardcoded data
			const brandsWithCountryFlag = brandsResult.map((brand) => ({
				...brand,
				countryFlagImage: brand.countryId
					? getCountryById(brand.countryId)?.flagImage
					: null,
			}));

			// Return empty array if no brands found instead of throwing error
			return brandsWithCountryFlag || [];
		} catch (error) {
			console.error("Error fetching dashboard brands data:", error);
			setResponseStatus(500);
			throw new Error("Failed to fetch dashboard brands data");
		}
	},
);
