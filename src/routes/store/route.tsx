import { createFileRoute, Outlet } from "@tanstack/react-router";
import { StorePageSkeleton } from "~/components/ui/store/skeletons/StorePageSkeleton";
import { storeDataQueryOptions } from "~/lib/queryOptions";

export const Route = createFileRoute("/store")({
	component: StoreLayout,
	pendingComponent: StorePageSkeleton,
	loader: async ({ context: { queryClient } }) => {
		await queryClient.ensureQueryData(storeDataQueryOptions());
	},
});

function StoreLayout() {
	return <Outlet />;
}
