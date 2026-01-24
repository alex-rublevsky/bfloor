import { createAuthClient } from "better-auth/react";

// Use current origin to avoid CORS issues
// This will automatically use the correct domain (localhost in dev, production URL in prod)
const baseURL =
	typeof window !== "undefined"
		? window.location.origin
		: process.env.BETTER_AUTH_URL || "https://bfloor.ru/";

export const { useSession, signIn, signOut, getSession } = createAuthClient({
	baseURL: baseURL,
	redirectTo: "/dashboard",
});
