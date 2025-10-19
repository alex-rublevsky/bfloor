import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { DB } from "~/db";
import { productStoreLocations } from "~/schema";

export const getProductStoreLocations = createServerFn({ method: "GET" })
	.inputValidator((data: { id: number }) => data)
	.handler(async ({ data }) => {
		const db = DB();
		const rows = await db
			.select()
			.from(productStoreLocations)
			.where(eq(productStoreLocations.productId, data.id));
		return rows;
	});

export const updateProductStoreLocations = createServerFn({ method: "POST" })
	.inputValidator(
		(data: { productId: number; storeLocationIds: number[] }) => data,
	)
	.handler(async ({ data }) => {
		const db = DB();

		// Delete existing relationships
		await db
			.delete(productStoreLocations)
			.where(eq(productStoreLocations.productId, data.productId));

		// Insert new relationships
		if (data.storeLocationIds.length > 0) {
			const insertData = data.storeLocationIds.map(
				(storeLocationId: number) => ({
					productId: data.productId,
					storeLocationId,
					createdAt: new Date(),
				}),
			);

			await db.insert(productStoreLocations).values(insertData);
		}

		return { message: "Product store locations updated" };
	});
