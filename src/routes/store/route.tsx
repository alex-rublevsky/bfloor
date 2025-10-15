import { createFileRoute, Outlet } from "@tanstack/react-router";
import { CartNav } from "~/components/ui/store/CartNav";
import { StorePageSkeleton } from "~/components/ui/store/skeletons/StorePageSkeleton";
import { CartProvider } from "~/lib/cartContext";
import { storeDataQueryOptions } from "~/lib/queryOptions";

export const Route = createFileRoute("/store")({
	component: StoreLayout,
	pendingComponent: StorePageSkeleton,
	loader: async ({ context: { queryClient } }) => {
		await queryClient.ensureQueryData(storeDataQueryOptions());
	},
});

function StoreLayout() {
	return (
		<CartProvider>
			<Outlet />
			<CartNav />
		</CartProvider>
	);
}
