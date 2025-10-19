/// <reference types="vite/client" />

import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
//import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import {
	createRootRoute,
	HeadContent,
	Outlet,
	Scripts,
	useRouter,
} from "@tanstack/react-router";
import type * as React from "react";
import { DefaultCatchBoundary } from "~/components/DefaultCatchBoundary";
import { NotFound } from "~/components/NotFound";

import CustomCursor from "~/components/ui/shared/custom_cursor/CustomCursor";
import { CursorContextProvider } from "~/components/ui/shared/custom_cursor/CustomCursorContext";
import { Footer } from "~/components/ui/shared/Footer";
import { NavBar } from "~/components/ui/shared/NavBar";
import { useIsMobile } from "~/hooks/use-mobile";
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

// Configure persistence - only runs on client side and only in production
if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
	const persister = createSyncStoragePersister({
		storage: window.localStorage,
		key: "RUBLEVSKY_QUERY_CACHE",
	});

	persistQueryClient({
		queryClient,
		persister,
		maxAge: 1000 * 60 * 60 * 24 * 1, // 1 day - persist for a day
		buster: "v12",
	});
}

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
		return (
			<RootDocument>
				<DefaultCatchBoundary {...props} />
			</RootDocument>
		);
	},
	notFoundComponent: () => <NotFound />,
	component: RootComponent,
	context: () => ({
		queryClient,
	}),
});

function RootComponent() {
	const isMobile = useIsMobile();

	return (
		<QueryClientProvider client={queryClient}>
			<CartProvider>
				<ClientSearchProvider>
					<CursorContextProvider>
						{!isMobile && <CustomCursor />}
						<RootDocument>
							<Outlet />
						</RootDocument>
					</CursorContextProvider>
				</ClientSearchProvider>
			</CartProvider>
		</QueryClientProvider>
	);
}

function RootDocument({ children }: { children: React.ReactNode }) {
	const router = useRouter();
	const pathname = router.state.location.pathname;

	// Don't render NavBar on dashboard pages since dashboard has its own NavBar
	const isDashboard = pathname.startsWith("/dashboard");

	return (
		<html
			lang="en"
			className={`${pathname === "/" ? "scroll-smooth" : ""} bg-background overscroll-none`}
			suppressHydrationWarning
		>
			<head>
				<HeadContent />
			</head>
			<body className="" suppressHydrationWarning>
				{!isDashboard && <NavBar />}
				{children}
				<Footer />
				{/* <TanStackRouterDevtools position="bottom-right" /> */}
				<Scripts />
			</body>
		</html>
	);
}
