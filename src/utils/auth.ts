import { env } from "cloudflare:workers";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { reactStartCookies } from "better-auth/react-start";
import { DB } from "~/db";
import { schema } from "../schema";

/**
 * BetterAuth configuration
 *
 * Note: BETTER_AUTH_SECRET, GOOGLE_CLIENT_ID, and GOOGLE_CLIENT_SECRET
 * must be set in .dev.vars for local development and as Wrangler secrets for production.
 * They need to be accessed synchronously at module initialization.
 *
 * SUPER_ADMIN_EMAIL, ADMIN_EMAIL, ADMIN_EMAIL_2, and RESEND_API_KEY can be in Secrets Store
 * (production) or .dev.vars (dev) because they're only accessed in async server functions.
 */
export const auth = betterAuth({
	database: drizzleAdapter(DB(), {
		provider: "sqlite", // D1 is SQLite-compatible
		schema: schema,
	}),
	baseURL: env.BETTER_AUTH_URL as string,
	secret: env.BETTER_AUTH_SECRET as unknown as string,
	socialProviders: {
		google: {
			clientId: env.GOOGLE_CLIENT_ID as unknown as string,
			clientSecret: env.GOOGLE_CLIENT_SECRET as unknown as string,
		},
	},
	plugins: [reactStartCookies()],
});
