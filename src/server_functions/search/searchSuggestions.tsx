/**
 * Search Suggestions / Autocomplete Server Function
 * Provides fast autocomplete suggestions as user types
 */

import { createServerFn } from "@tanstack/react-start";
import { sql } from "drizzle-orm";
import { DB } from "~/db";
import { buildFts5AutocompleteQuery } from "~/utils/search/queryExpander";

/**
 * Suggestion item
 */
export interface SearchSuggestion {
	text: string;
	type: "product" | "brand" | "category" | "collection";
	count?: number; // Number of results for this suggestion
	metadata?: {
		slug?: string; // For categories, brands, collections - used for navigation
	};
}

/**
 * Suggestions response
 */
export interface SearchSuggestionsResponse {
	suggestions: SearchSuggestion[];
	query: string;
}

/**
 * Search suggestions server function
 */
export const searchSuggestions = createServerFn({ method: "GET" })
	.inputValidator(
		(data: { query: string; limit?: number; includeTypoVariants?: boolean }) =>
			data,
	)
	.handler(
		async ({
			data,
		}: {
			data: { query: string; limit?: number; includeTypoVariants?: boolean };
		}) => {
			const { query, limit = 10 } = data;

			// Validate query
			if (!query || query.trim().length < 2) {
				return {
					suggestions: [],
					query: query || "",
				} as SearchSuggestionsResponse;
			}

			const db = DB();
			const normalizedQuery = query.trim().replace(/\s+/g, " ");

			// Build FTS5 autocomplete query (prefix matching)
			const ftsQuery = buildFts5AutocompleteQuery(normalizedQuery);

			if (!ftsQuery) {
				return {
					suggestions: [],
					query: normalizedQuery,
				} as SearchSuggestionsResponse;
			}

			try {
				// Search for suggestions in parallel across all entity types
				// Now using Drizzle since FTS5 virtual tables are properly created
				// ORDER BY rank ensures most relevant results appear first
				const [
					productSuggestions,
					brandSuggestions,
					categorySuggestions,
					collectionSuggestions,
				] = await Promise.all([
					// Product suggestions
					db
						.all<{ name: string }>(
							sql`SELECT p.name 
						    FROM products p 
						    JOIN products_fts ON products_fts.rowid = p.id 
						    WHERE products_fts MATCH ${ftsQuery} 
						    ORDER BY rank 
						    LIMIT ${limit}`,
						)
						.then((rows) =>
							rows.map((row) => ({
								text: row.name || "",
								type: "product" as const,
								metadata: {},
							})),
						)
						.catch(() => []),

					// Brand suggestions
					db
						.all<{ name: string; slug: string }>(
							sql`SELECT b.name, b.slug 
						    FROM brands b 
						    JOIN brands_fts ON brands_fts.rowid = b.id 
						    WHERE brands_fts MATCH ${ftsQuery} 
						    ORDER BY rank 
						    LIMIT ${Math.floor(limit / 2)}`,
						)
						.then((rows) =>
							rows.map((row) => ({
								text: row.name || "",
								type: "brand" as const,
								metadata: { slug: row.slug },
							})),
						)
						.catch(() => []),

					// Category suggestions
					db
						.all<{ name: string; slug: string }>(
							sql`SELECT c.name, c.slug 
						    FROM categories c 
						    JOIN categories_fts ON categories_fts.rowid = c.id 
						    WHERE categories_fts MATCH ${ftsQuery} 
						    ORDER BY rank 
						    LIMIT ${Math.floor(limit / 2)}`,
						)
						.then((rows) =>
							rows.map((row) => ({
								text: row.name || "",
								type: "category" as const,
								metadata: { slug: row.slug },
							})),
						)
						.catch(() => []),

					// Collection suggestions
					db
						.all<{ name: string; slug: string }>(
							sql`SELECT col.name, col.slug 
						    FROM collections col 
						    JOIN collections_fts ON collections_fts.rowid = col.id 
						    WHERE collections_fts MATCH ${ftsQuery} 
						    ORDER BY rank 
						    LIMIT ${Math.floor(limit / 2)}`,
						)
						.then((rows) =>
							rows.map((row) => ({
								text: row.name || "",
								type: "collection" as const,
								metadata: { slug: row.slug },
							})),
						)
						.catch(() => []),
				]);

				// Combine all suggestions
				// Prioritize categories, brands, and collections over products for better UX
				const allSuggestions = [
					...categorySuggestions,
					...brandSuggestions,
					...collectionSuggestions,
					...productSuggestions,
				];

				// Deduplicate by text (case-insensitive)
				const seenTexts = new Set<string>();
				const uniqueSuggestions = allSuggestions.filter((suggestion) => {
					const lowerText = suggestion.text.toLowerCase();
					if (seenTexts.has(lowerText)) {
						return false;
					}
					seenTexts.add(lowerText);
					return true;
				});

				// Limit to requested number
				const limitedSuggestions = uniqueSuggestions.slice(0, limit);

				return {
					suggestions: limitedSuggestions,
					query: normalizedQuery,
				} as SearchSuggestionsResponse;
			} catch (error) {
				console.error("Search suggestions error:", error);
				return {
					suggestions: [],
					query: normalizedQuery,
				} as SearchSuggestionsResponse;
			}
		},
	);

/**
 * Get popular search terms (for empty state or trending)
 * Returns active categories as popular suggestions
 */
export const popularSearchTerms = createServerFn({ method: "GET" })
	.inputValidator((data: { limit?: number } = {}) => data)
	.handler(async ({ data }: { data?: { limit?: number } }) => {
		const limit = data?.limit ?? 10;

		try {
			const db = DB();

			// Fetch active categories ordered by their display order
			const categories = await db.all<{ name: string; slug: string }>(
				sql`SELECT name, slug 
				    FROM categories 
				    WHERE is_active = 1 
				    ORDER BY "order" ASC 
				    LIMIT ${limit}`,
			);

			const popularTerms: SearchSuggestion[] = categories.map((cat) => ({
				text: cat.name,
				type: "category" as const,
				metadata: { slug: cat.slug },
			}));

			return {
				suggestions: popularTerms,
				query: "",
			} as SearchSuggestionsResponse;
		} catch (error) {
			console.error("Error fetching popular categories:", error);
			// Fallback to empty suggestions on error
			return {
				suggestions: [],
				query: "",
			} as SearchSuggestionsResponse;
		}
	});
