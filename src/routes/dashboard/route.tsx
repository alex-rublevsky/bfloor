import {
	createFileRoute,
	Outlet,
	redirect,
	useLoaderData,
} from "@tanstack/react-router";
import { NavBar } from "~/components/ui/shared/NavBar";
import { Toaster } from "~/components/ui/shared/sonner";
import { getUserData } from "~/utils/auth-server-func";

export const Route = createFileRoute("/dashboard")({
	// Use beforeLoad for security: prevents child routes from loading if auth fails
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
	// Loader just passes through the user data from beforeLoad context
	loader: async ({ context }) => {
		return {
			userID: context.userData.userID,
			userName: context.userData.userName,
			userEmail: context.userData.userEmail,
			userAvatar: context.userData.userAvatar,
		};
	},
	component: RouteComponent,
});

function RouteComponent() {
	const loaderData = useLoaderData({ from: "/dashboard" }) as
		| {
				userID: string;
				userName: string;
				userEmail: string;
				userAvatar: string;
		  }
		| undefined;

	// Get the action handler from route context if it exists
	const handleActionClick = () => {
		// Dispatch a custom event that child routes can listen to
		window.dispatchEvent(new CustomEvent("dashboardAction"));
	};

	return (
		<div className="min-h-screen bg-background">
			<main className="py-8 pb-24">
				<Outlet />
			</main>
			<NavBar userData={loaderData} onActionClick={handleActionClick} />
			<Toaster />
		</div>
	);
}
