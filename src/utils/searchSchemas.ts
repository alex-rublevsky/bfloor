import { z } from "zod";

/**
 * Simple search schema for dashboard pages with only text search
 * Used by: brands, collections, categories, attributes, orders, and dashboard layout
 *
 * Handles both string and number inputs (router can parse numeric strings as numbers)
 * and transforms them to strings for consistent handling.
 */
export const simpleSearchSchema = z.object({
	search: z
		.union([z.string(), z.number()])
		.transform((val) => (typeof val === "number" ? String(val) : val))
		.optional(),
});

/**
 * Type inference for simple search params
 */
export type SimpleSearch = z.infer<typeof simpleSearchSchema>;
