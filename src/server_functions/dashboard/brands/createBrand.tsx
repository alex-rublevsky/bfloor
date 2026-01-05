import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { DB } from "~/db";
import { brands } from "~/schema";
import type { BrandFormData } from "~/types";
import { moveSingleStagingImage } from "../store/moveStagingImages";

export const createBrand = createServerFn({ method: "POST" })
	.inputValidator((data: BrandFormData) => data)
	.handler(async ({ data }) => {
		try {
			const db = DB();
			const brandData = data;

			if (!brandData.name || !brandData.slug) {
				setResponseStatus(400);
				throw new Error("Missing required fields: name and slug are required");
			}

			// Check for duplicate slug
			const existingBrand = await db
				.select({ slug: brands.slug })
				.from(brands)
				.where(eq(brands.slug, brandData.slug))
				.limit(1);

			if (existingBrand.length > 0) {
				setResponseStatus(409);
				throw new Error("A brand with this slug already exists");
			}

			// Move staging images to final location before saving
			const finalLogo = await moveSingleStagingImage(brandData.logo, {
				finalFolder: "brands",
				slug: brandData.slug,
				productName: brandData.name,
			});

			// Insert the brand
			const insertResult = await db
				.insert(brands)
				.values({
					name: brandData.name,
					slug: brandData.slug,
					image: finalLogo || null,
					countryId: brandData.countryId || null,
					isActive: brandData.isActive ?? true,
				})
				.returning();

			return {
				message: "Brand created successfully",
				brand: insertResult[0],
			};
		} catch (error) {
			console.error("Error creating brand:", error);
			setResponseStatus(500);
			throw new Error("Failed to create brand");
		}
	});
