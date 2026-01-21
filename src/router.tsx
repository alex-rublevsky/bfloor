import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { DefaultCatchBoundary } from "./components/DefaultCatchBoundary";
import { NotFound } from "./components/NotFound";
import { routeTree } from "./routeTree.gen";
import { incrementProductView } from "./server_functions/store/incrementProductView";

export function getRouter() {
	const router = createTanStackRouter({
		routeTree,
		defaultPreload: "intent",
		context: {},
		scrollRestoration: true,
		defaultStructuralSharing: true, //TODO: what is this?
		defaultPreloadStaleTime: 0,
		defaultViewTransition: true,
		scrollRestorationBehavior: "instant", // Instant scroll for better UX with virtualized lists and view transitions
		defaultErrorComponent: DefaultCatchBoundary,
		defaultNotFoundComponent: () => <NotFound />,
	});

	// Track product views on actual navigation (not prefetch)
	router.subscribe("onResolved", () => {
		const { pathname } = router.state.location;
		const { matches } = router.state;

		// Only track public product pages (exclude dashboard)
		if (
			pathname.startsWith("/dashboard/") ||
			!pathname.startsWith("/product/")
		) {
			return;
		}

		const match = matches.find((m) => m.routeId === "/product/$productId");
		if (!match?.loaderData) return;

		// Extract product ID safely
		const loaderData = match.loaderData;
		if (
			typeof loaderData === "object" &&
			loaderData !== null &&
			"product" in loaderData
		) {
			const productId = (loaderData as { product: { id?: number } }).product
				?.id;
			if (productId) {
				incrementProductView({ data: productId }).catch(() => {
					// Silently fail - view tracking shouldn't break navigation
				});
			}
		}
	});

	return router;
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
