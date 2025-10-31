import {
	createFileRoute,
	Outlet,
	// redirect,
	useLoaderData,
	useRouter,
} from "@tanstack/react-router";
import { Toaster } from "~/components/ui/shared/sonner";
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
    validateSearch,
});

function DashboardLayout() {
    const _loaderData = useLoaderData({ from: "/dashboard" }) as
        | {
                userID: string;
                userName: string;
                userEmail: string;
                userAvatar: string;
          }
        | undefined;

    const _router = useRouter();

	return (
		<div className="h-screen bg-background flex flex-col">
			<main className="flex-1">
				<Outlet />
			</main>
			<Toaster className="fixed top-4 right-4 z-50" />
		</div>
	);
}

function RouteComponent() {
    return (
        <DashboardLayout />
    );
}
