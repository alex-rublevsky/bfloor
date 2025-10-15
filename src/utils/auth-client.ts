import { createAuthClient } from "better-auth/react";

const baseURL = "https://rublevsky.studio";
//const baseURL = "http://localhost:3000";

export const { useSession, signIn, signOut, getSession } = createAuthClient({
	baseURL: baseURL,
	redirectTo: "/dashboard",
});
