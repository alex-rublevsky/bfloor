/// <reference types="vite/client" />

//import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	createRootRoute,
	HeadContent,
	Outlet,
	Scripts,
	useRouterState,
} from "@tanstack/react-router";
import type * as React from "react";
import { DefaultCatchBoundary } from "~/components/DefaultCatchBoundary";
import { NotFound } from "~/components/NotFound";

import { Footer } from "~/components/ui/shared/Footer";
import { NavBar } from "~/components/ui/shared/NavBar";
import { CartProvider } from "~/lib/cartContext";
import { ClientSearchProvider } from "~/lib/clientSearchContext";
import { seo } from "~/utils/seo";
import appCss from "../styles/app.css?url";

// Create QueryClient with optimized defaults
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days - keep data in cache
			staleTime: 1000 * 60 * 60 * 24, // 24 hours - consider data fresh
		},
	},
});

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			...seo({
				title: "BeautyFloor",
				description: `Напольные покрытия во Владивостоке`,
			}),
		],
		links: [
			{ rel: "stylesheet", href: appCss },
			{
				rel: "preload",
				href: "/fonts/OverusedGrotesk-VF.woff2",
				as: "font",
				type: "font/woff2",
				crossOrigin: "anonymous",
			},
			{
				rel: "apple-touch-icon",
				sizes: "180x180",
				href: "/apple-touch-icon.png",
			},
			{
				rel: "icon",
				type: "image/png",
				sizes: "96x96",
				href: "/favicon-96x96.png",
			},
			{
				rel: "icon",
				type: "image/png",
				sizes: "16x16",
				href: "/favicon-16x16.png",
			},
			{ rel: "manifest", href: "/site.webmanifest", color: "#fffff" },
			{ rel: "icon", href: "/favicon.ico" },
		],
	}),
	errorComponent: (props) => {
		return <DefaultCatchBoundary {...props} />;
	},
	notFoundComponent: () => <NotFound />,
	component: RootComponent,
	context: () => ({
		queryClient,
	}),
});

function RootComponent() {
	return (
		<QueryClientProvider client={queryClient}>
			<CartProvider>
				<ClientSearchProvider>
					<RootDocument>
						<Outlet />
					</RootDocument>
				</ClientSearchProvider>
			</CartProvider>
		</QueryClientProvider>
	);
}

function RootDocument({ children }: { children: React.ReactNode }) {
	const routerState = useRouterState();
	const pathname = routerState.location.pathname;

	const isStore = pathname.startsWith("/store");
	const isDashboard = pathname.startsWith("/dashboard");

	return (
		<html
			lang="en"
			className={`${pathname === "/" ? "scroll-smooth" : ""} bg-background`}
			suppressHydrationWarning
		>
			<head>
				<HeadContent />
			</head>
			<body className={"min-h-screen flex flex-col"} suppressHydrationWarning>
				<NavBar />

				<main className="flex-1">{children}</main>
				{!isStore && !isDashboard && <Footer />}
				{/* <TanStackRouterDevtools position="bottom-right" /> */}
				<Scripts />
			</body>
		</html>
	);
}
