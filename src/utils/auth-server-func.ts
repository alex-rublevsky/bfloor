import { env } from "cloudflare:workers";
import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "~/utils/auth-middleware";
import { resolveSecret } from "~/utils/cloudflare-env";

type User = {
	id?: string;
	name?: string;
	email?: string;
	image?: string | null;
} | null;

type AuthContext = {
	user: User;
};

/**
 * Get complete user data with admin status in a single call.
 * This is the most efficient way to get user info + auth status.
 * Use this for protected routes that need user data.
 */
export const getUserData = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.handler(async ({ context }: { context: AuthContext }) => {
		const user = context?.user;
		const userEmailRaw = user?.email ?? null;
		const adminEmailRaw = await resolveSecret(env.ADMIN_EMAIL);

		const userEmail = userEmailRaw?.trim().toLowerCase() ?? null;
		const adminEmail = adminEmailRaw?.trim().toLowerCase() ?? null;
		const isAuthenticated = !!userEmail;
		const isAdmin = !!userEmail && !!adminEmail && userEmail === adminEmail;

		return {
			userID: user?.id ?? null,
			userName: user?.name ?? null,
			userEmail: userEmail,
			userAvatar: user?.image ?? null,
			isAuthenticated,
			isAdmin,
		};
	});

/**
 * Lightweight auth status check without throwing errors.
 * Use this for public pages (e.g., login) that need to check auth status.
 */
export const getAuthStatus = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.handler(async ({ context }: { context: AuthContext }) => {
		const userEmailRaw = context?.user?.email ?? null;
		const adminEmailRaw = await resolveSecret(env.ADMIN_EMAIL);

		const userEmail = userEmailRaw?.trim().toLowerCase() ?? null;
		const adminEmail = adminEmailRaw?.trim().toLowerCase() ?? null;
		const isAuthenticated = !!userEmail;
		const isAdmin = !!userEmail && !!adminEmail && userEmail === adminEmail;

		return {
			isAuthenticated,
			isAdmin,
			userEmail,
		};
	});
