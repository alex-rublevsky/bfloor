import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { DB } from "~/db";
import type * as schema from "~/schema";
import { brands } from "~/schema";
import type { BrandFormData } from "~/types";

export const createBrand = createServerFn({ method: "POST" })
	.inputValidator((data: BrandFormData) => data)
	.handler(async ({ data }) => {
		try {
			const db: DrizzleD1Database<typeof schema> = DB();
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

			// Insert the brand
			const insertResult = await db
				.insert(brands)
				.values({
					name: brandData.name,
					slug: brandData.slug,
					image: brandData.logo || null,
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
