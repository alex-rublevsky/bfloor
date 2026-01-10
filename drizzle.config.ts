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
	tablesFilter: [
		"!*_fts",
		"!*_fts_data",
		"!*_fts_idx",
		"!*_fts_docsize",
		"!*_fts_config",
	],
});
