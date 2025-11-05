import { createFileRoute, Outlet } from "@tanstack/react-router";
import { StorePageSkeleton } from "~/components/ui/store/skeletons/StorePageSkeleton";

export const Route = createFileRoute("/store")({
	component: StoreLayout,
	pendingComponent: StorePageSkeleton,
});

function StoreLayout() {
	return (
		<div className="h-screen bg-background flex flex-col">
			<div className="flex-1">
				<Outlet />
			</div>
		</div>
	);
}
