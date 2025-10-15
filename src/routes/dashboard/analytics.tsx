import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/analytics")({
	component: RouteComponent,
});

function RouteComponent() {
	return <div>This page is WIP</div>;
}
