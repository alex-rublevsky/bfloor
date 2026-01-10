/**
 * FTS5 Query Builder - Simplified
 * Relies on trigram tokenizer for fuzzy matching instead of generating variants
 */

/**
 * Escape special FTS5 characters in a search term
 */
export function escapeFts5Term(term: string): string {
	// Escape FTS5 special characters: " * ( ) AND OR NOT
	return term
		.replace(/"/g, '""')
		.replace(/\*/g, "")
		.replace(/[()]/g, "")
		.trim();
}

/**
 * Build an FTS5 query from a single term with prefix matching
 * Trigram tokenizer handles fuzzy matching automatically
 * Note: Trigrams require at least 3 characters to work properly
 */
export function buildFts5TermQuery(
	term: string,
	enablePrefixMatch = true,
): string {
	const cleanTerm = escapeFts5Term(term);
	// Trigram tokenizer requires at least 3 characters to form trigrams
	// Shorter terms will return empty string (no results)
	if (!cleanTerm || cleanTerm.length < 3) return "";

	// For trigram tokenizer, use unquoted terms for better fuzzy matching
	// Prefix matching works better without quotes for trigrams
	return enablePrefixMatch ? `${cleanTerm}*` : cleanTerm;
}

/**
 * Build an FTS5 query from multiple search terms
 * Simple and fast - let trigram tokenizer do the heavy lifting
 * Returns empty string if no terms are long enough for trigram matching (< 3 chars)
 */
export function buildFts5Query(
	searchQuery: string,
	options: {
		enablePrefixMatch?: boolean;
		operator?: "AND" | "OR";
	} = {},
): string {
	const { enablePrefixMatch = true, operator = "AND" } = options;

	// Normalize and split search query into terms
	const normalizedQuery = searchQuery.trim().replace(/\s+/g, " ");
	if (!normalizedQuery) return "";

	// Keep all terms for splitting, but filter will happen in buildFts5TermQuery
	const terms = normalizedQuery.split(/\s+/).filter((t) => t.length >= 1);
	if (terms.length === 0) return "";

	// Build FTS5 query for each term (only terms >= 3 chars will return results)
	const termQueries = terms
		.map((term) => buildFts5TermQuery(term, enablePrefixMatch))
		.filter((q) => q.length > 0);

	// If no terms are long enough for FTS5, return empty string (no results)
	if (termQueries.length === 0) return "";
	if (termQueries.length === 1) return termQueries[0];

	// Join terms with the specified operator
	return `${termQueries.join(` ${operator} `)}`;
}

/**
 * Build a query for autocomplete/suggestions (prefix matching)
 */
export function buildFts5AutocompleteQuery(prefix: string): string {
	const cleanPrefix = escapeFts5Term(prefix);
	if (!cleanPrefix || cleanPrefix.length < 3) return "";

	// Use unquoted prefix for better trigram matching
	return `${cleanPrefix}*`;
}
