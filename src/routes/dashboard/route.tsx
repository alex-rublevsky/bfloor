import {
	createFileRoute,
	Outlet,
	// redirect,
	useLoaderData,
	useRouter,
} from "@tanstack/react-router";
import { NavBar } from "~/components/ui/shared/NavBar";
import { Toaster } from "~/components/ui/shared/sonner";
import {
	DashboardSearchProvider,
	useDashboardSearch,
} from "~/lib/dashboardSearchContext";
// import { getUserData } from "~/utils/auth-server-func";

export const Route = createFileRoute("/dashboard")({
	// beforeLoad temporarily disabled for local development access
	// beforeLoad: async () => {
	//     try {
	//         const userData = await getUserData();
	//
	//         // Check if user is authenticated and is admin
	//         if (!userData.isAuthenticated || !userData.isAdmin) {
	//             throw redirect({ to: "/login" });
	//         }
	//
	//         // Ensure we have required user data
	//         if (!userData.userID || !userData.userEmail) {
	//             throw redirect({ to: "/login" });
	//         }
	//
	//         // Return user data in context for the loader to use
	//         return { userData };
	//     } catch {
	//         throw redirect({ to: "/login" });
	//     }
	// },
	// Loader just passes through the user data from beforeLoad context
	// Provide safe defaults during development since beforeLoad is disabled
	loader: async () => {
		return {
			// userID: context.userData.userID,
			// userName: context.userData.userName,
			// userEmail: context.userData.userEmail,
			// userAvatar: context.userData.userAvatar,
			userID: "",
			userName: "",
			userEmail: "",
			userAvatar: "",
		};
	},
	component: RouteComponent,
});

function DashboardLayout() {
	const loaderData = useLoaderData({ from: "/dashboard" }) as
		| {
				userID: string;
				userName: string;
				userEmail: string;
				userAvatar: string;
		  }
		| undefined;

	const router = useRouter();
	const pathname = router.state.location.pathname;

	const { searchTerm, setSearchTerm } = useDashboardSearch();

	// Only provide search functionality to pages that need it (not misc page)
	// Check if we're on the misc page specifically
	const isMiscPage = pathname === "/dashboard/misc";
	const shouldProvideSearch = !isMiscPage;

	return (
		<div className="min-h-screen bg-background">
			<NavBar
				userData={loaderData}
				searchTerm={shouldProvideSearch ? searchTerm : undefined}
				onSearchChange={shouldProvideSearch ? setSearchTerm : undefined}
			/>
			<main className="pb-8">
				<Outlet />
			</main>
			<Toaster />
		</div>
	);
}

function RouteComponent() {
	return (
		<DashboardSearchProvider>
			<DashboardLayout />
		</DashboardSearchProvider>
	);
}
