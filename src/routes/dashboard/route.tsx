import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Toaster } from "~/components/ui/shared/sonner";
import { userDataQueryOptions } from "~/lib/queryOptions";
import { getUserData } from "~/utils/auth-server-func";

const validateSearch = (search: Record<string, unknown>) => {
	const result: { search?: string } = {};
	// Handle both string and number (numeric strings can be parsed as numbers by the router)
	if (typeof search.search === "string") {
		result.search = search.search;
	} else if (typeof search.search === "number") {
		// Convert number back to string (e.g., "12345" might be parsed as 12345)
		result.search = String(search.search);
	}
	return result;
};

export const Route = createFileRoute("/dashboard")({
	// beforeLoad temporarily disabled for local development access
	beforeLoad: async () => {
		try {
			const userData = await getUserData();

			// Check if user is authenticated and is admin
			if (!userData.isAuthenticated || !userData.isAdmin) {
				throw redirect({ to: "/login" });
			}

			// Ensure we have required user data
			if (!userData.userID || !userData.userEmail) {
				throw redirect({ to: "/login" });
			}

			// Return user data in context for the loader to use
			return { userData };
		} catch {
			throw redirect({ to: "/login" });
		}
	},
	// Loader prefetches userData for NavBar and other components
	loader: async ({ context }) => {
		const { queryClient } = context;
		// Prefetch userData so NavBar can use it immediately from cache
		await queryClient.ensureQueryData(userDataQueryOptions());
		// Return empty object - data is now in query cache
		return {};
	},
	component: RouteComponent,
	validateSearch,
});

function DashboardLayout() {
	return (
		<>
			<Outlet />
			<Toaster className="fixed top-4 right-4 z-50" />
		</>
	);
}

function RouteComponent() {
	return <DashboardLayout />;
}
