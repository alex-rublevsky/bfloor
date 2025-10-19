import { createServerFn } from "@tanstack/react-start";
import { DB } from "~/db";
import { productAttributes } from "~/schema";
import type { ProductAttribute } from "~/types";

export const getAllProductAttributes = createServerFn({ method: "GET" })
	.inputValidator(() => ({}))
	.handler(async (): Promise<ProductAttribute[]> => {
		const db = DB();

		const attributes = await db
			.select()
			.from(productAttributes)
			.orderBy(productAttributes.name);

		return attributes;
	});
