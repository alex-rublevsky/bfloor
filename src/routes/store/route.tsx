import { createFileRoute, Outlet } from "@tanstack/react-router";
import { StorePageSkeleton } from "~/components/ui/store/skeletons/StorePageSkeleton";

export const Route = createFileRoute("/store")({
	component: StoreLayout,
	pendingComponent: StorePageSkeleton,
});

function StoreLayout() {
	return <Outlet />;
}
