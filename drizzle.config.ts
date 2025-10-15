import { defineConfig } from "drizzle-kit";

const requiredEnvVars = {
	CLOUDFLARE_D1_ACCOUNT_ID: process.env.CLOUDFLARE_D1_ACCOUNT_ID,
	DATABASE: process.env.DATABASE,
	CLOUDFLARE_D1_API_TOKEN: process.env.CLOUDFLARE_D1_API_TOKEN,
} as const;

// Validate required environment variables
for (const [key, value] of Object.entries(requiredEnvVars)) {
	if (!value) {
		throw new Error(`Missing required environment variable: ${key}`);
	}
}

export default defineConfig({
	dialect: "sqlite",
	schema: "./src/schema.ts",
	out: "./drizzle",
	driver: "d1-http",
	dbCredentials: {
		accountId: requiredEnvVars.CLOUDFLARE_D1_ACCOUNT_ID,
		databaseId: requiredEnvVars.DATABASE,
		token: requiredEnvVars.CLOUDFLARE_D1_API_TOKEN,
	},
});
