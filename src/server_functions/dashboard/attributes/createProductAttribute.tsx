import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { DB } from "~/db";
import { productAttributes } from "~/schema";
import type { ProductAttribute } from "~/types";

export const createProductAttribute = createServerFn({ method: "POST" })
	.inputValidator((data: { name: string; slug: string }) => data)
	.handler(
		async ({
			data,
		}): Promise<{ attribute: ProductAttribute; message: string }> => {
			const db = DB();

			// Validate that slug is not empty
			if (!data.slug.trim()) {
				throw new Error("Cannot create attribute: slug must not be empty");
			}

			// Check if attribute with this name already exists
			const existingByName = await db
				.select()
				.from(productAttributes)
				.where(eq(productAttributes.name, data.name))
				.limit(1);

			if (existingByName.length > 0) {
				throw new Error(`Attribute with name "${data.name}" already exists`);
			}

			// Check if attribute with this slug already exists
			const existingBySlug = await db
				.select()
				.from(productAttributes)
				.where(eq(productAttributes.slug, data.slug))
				.limit(1);

			if (existingBySlug.length > 0) {
				throw new Error(`Attribute with slug "${data.slug}" already exists`);
			}

			const newAttribute = await db
				.insert(productAttributes)
				.values({
					name: data.name,
					slug: data.slug,
				})
				.returning();

			return {
				attribute: newAttribute[0],
				message: "Product attribute created successfully",
			};
		},
	);
