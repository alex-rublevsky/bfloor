import { createFileRoute, Outlet } from "@tanstack/react-router";
import { CartProvider } from "~/lib/cartContext";

export const Route = createFileRoute("/product")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<>
			<div>Product Layout</div>
			<CartProvider>
				<Outlet />
			</CartProvider>
		</>
	);
}
