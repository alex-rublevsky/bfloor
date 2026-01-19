import { defineConfig } from "drizzle-kit";

// Validate required environment variables
if (!process.env.TURSO_DATABASE_URL) {
	throw new Error("Missing required environment variable: TURSO_DATABASE_URL");
}
if (!process.env.TURSO_AUTH_TOKEN) {
	throw new Error("Missing required environment variable: TURSO_AUTH_TOKEN");
}

const requiredEnvVars = {
	TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL,
	TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN,
};

export default defineConfig({
	dialect: "turso",
	schema: "./src/schema.ts",
	out: "./drizzle",
	dbCredentials: {
		url: requiredEnvVars.TURSO_DATABASE_URL,
		authToken: requiredEnvVars.TURSO_AUTH_TOKEN,
	},
	// Exclude FTS5 virtual tables from Drizzle's schema introspection
	// These tables are managed by raw SQL migrations and SQLite triggers
	// FTS5 creates multiple shadow tables: *_fts, *_fts_content, *_fts_data, *_fts_idx, *_fts_docsize, *_fts_config
	// Using explicit patterns to ensure all FTS variants are excluded
	tablesFilter: [
		"!products_fts*", // Exclude all products_fts variants
		"!brands_fts*", // Exclude all brands_fts variants
		"!categories_fts*", // Exclude all categories_fts variants
		"!collections_fts*", // Exclude all collections_fts variants
		"!*_fts_content", // Exclude all FTS5 content shadow tables (catch-all)
		"!*_fts_data", // Exclude all FTS5 data shadow tables (catch-all)
		"!*_fts_idx", // Exclude all FTS5 index shadow tables (catch-all)
		"!*_fts_docsize", // Exclude all FTS5 docsize shadow tables (catch-all)
		"!*_fts_config", // Exclude all FTS5 config shadow tables (catch-all)
	],
});
