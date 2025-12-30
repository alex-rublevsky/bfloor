import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "~/utils/auth-middleware";
import { env, resolveSecret } from "~/utils/env";

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
 * Check if a user email matches any of the admin emails.
 * Checks SUPER_ADMIN_EMAIL, ADMIN_EMAIL, and ADMIN_EMAIL_2.
 *
 * @param userEmail - The user's email address (normalized)
 * @returns true if the email matches any admin email, false otherwise
 */
async function isAdminEmail(userEmail: string | null): Promise<boolean> {
	if (!userEmail) {
		return false;
	}

	// Resolve all admin emails from environment variables
	const [superAdminEmail, adminEmail, adminEmail2, adminEmail3] =
		await Promise.all([
			resolveSecret(env.SUPER_ADMIN_EMAIL),
			resolveSecret(env.ADMIN_EMAIL),
			resolveSecret(env.ADMIN_EMAIL_2),
			resolveSecret(env.ADMIN_EMAIL_3),
		]);

	// Normalize all admin emails (trim and lowercase)
	const adminEmails = [
		superAdminEmail?.trim().toLowerCase(),
		adminEmail?.trim().toLowerCase(),
		adminEmail2?.trim().toLowerCase(),
		adminEmail3?.trim().toLowerCase(),
	].filter((email): email is string => !!email); // Filter out null/undefined

	// Check if user email matches any admin email
	return adminEmails.includes(userEmail);
}

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

		const userEmail = userEmailRaw?.trim().toLowerCase() ?? null;
		const isAuthenticated = !!userEmail;
		const isAdmin = isAuthenticated && (await isAdminEmail(userEmail));

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

		const userEmail = userEmailRaw?.trim().toLowerCase() ?? null;
		const isAuthenticated = !!userEmail;
		const isAdmin = isAuthenticated && (await isAdminEmail(userEmail));

		return {
			isAuthenticated,
			isAdmin,
			userEmail,
		};
	});
