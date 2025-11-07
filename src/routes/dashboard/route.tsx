import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Toaster } from "~/components/ui/shared/sonner";
import { userDataQueryOptions } from "~/lib/queryOptions";
import { getUserData } from "~/utils/auth-server-func";

// import { getUserData } from "~/utils/auth-server-func";

const validateSearch = (search: Record<string, unknown>) => {
	const result: { search?: string } = {};
	if (typeof search.search === "string") {
		result.search = search.search;
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
		<div className="h-screen bg-background flex flex-col">
			<div className="flex-1">
				<Outlet />
			</div>
			<Toaster className="fixed top-4 right-4 z-50" />
		</div>
	);
}

function RouteComponent() {
	return <DashboardLayout />;
}
