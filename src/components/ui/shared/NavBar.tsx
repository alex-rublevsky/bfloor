import {
	IconBadgeTm,
	IconBox,
	IconCategory,
	IconDashboard,
	IconPackage,
} from "@tabler/icons-react";
import {
	Link,
	useNavigate,
	useRouter,
	useRouterState,
} from "@tanstack/react-router";
import { ArrowLeftFromLine, LogOutIcon, Plus } from "lucide-react";
import type React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "~/components/ui/DropdownMenu";
import { usePrefetch } from "~/hooks/usePrefetch";
import { signOut } from "~/utils/auth-client";
import { cn } from "~/utils/utils";
import { Button } from "./Button";

interface NavItem {
	name: string;
	url: string;
	icon?: React.ComponentType;
}

interface NavBarProps {
	items?: NavItem[];
	className?: string;
	userData?: {
		userID: string;
		userName: string;
		userEmail: string;
		userAvatar: string;
	};
	onActionClick?: () => void;
}

// Dashboard navigation items
const dashboardNavItems: NavItem[] = [
	{ name: "Главная страница", url: "/dashboard", icon: IconDashboard },
	{ name: "Products", url: "/dashboard/products", icon: IconBox },
	{ name: "Categories", url: "/dashboard/categories", icon: IconCategory },
	{ name: "Brands", url: "/dashboard/brands", icon: IconBadgeTm },
	{ name: "Orders", url: "/dashboard/orders", icon: IconPackage },
];

const dashboardSecondaryItems: NavItem[] = [
	{ name: "Back to Website", url: "/", icon: ArrowLeftFromLine },
];

const DropdownNavMenu = ({
	items,
	showUserInfo = false,
	userData,
}: {
	items: NavItem[];
	showUserInfo?: boolean;
	userData?: {
		userID: string;
		userName: string;
		userEmail: string;
		userAvatar: string;
	};
}) => {
	const navigate = useNavigate();

	const userID = userData?.userID || "";
	const userName = userData?.userName || "";
	const userEmail = userData?.userEmail || "";
	const userAvatar = userData?.userAvatar || "";

	return (
		<DropdownMenu>
			<DropdownMenuTrigger className="relative flex w-fit rounded-full border border-black bg-background hover:bg-primary hover:text-primary-foreground active:bg-primary active:text-primary-foreground transition-all duration-300 p-[0.3rem] focus:outline-hidden focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
				<span className="relative z-10 block cursor-pointer px-3 py-1.5 text-xs text-primary-foreground mix-blend-difference md:px-4 md:py-2 md:text-sm">
					Menu
				</span>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				side="top"
				align="start"
				className="mb-2 rounded-2xl border border-black bg-background text-foreground"
			>
				{showUserInfo && (
					<>
						<div className="flex items-center gap-2 px-3 py-2 border-b border-border">
							<Avatar className="h-8 w-8 rounded-lg">
								<AvatarImage src={userAvatar} alt={userName || userID} />
								<AvatarFallback className="rounded-lg">
									{userName ? userName.charAt(0).toUpperCase() : "U"}
								</AvatarFallback>
							</Avatar>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-medium">
									{userName || userID}
								</span>
								<span className="truncate text-xs text-muted-foreground">
									{userEmail}
								</span>
							</div>
						</div>
						<DropdownMenuItem
							onClick={async () => {
								try {
									const _result = await signOut();

									// Clear any local storage or cached data
									localStorage.clear();
									sessionStorage.clear();

									// Force a page reload to clear any cached state and ensure clean logout
									window.location.href = "/";
								} catch (error) {
									console.error("Logout failed", error);

									// Clear local storage even if signOut fails
									localStorage.clear();
									sessionStorage.clear();

									// Fallback to navigation if signOut fails
									navigate({ to: "/" });
								}
							}}
							className="flex items-center gap-2 py-2 px-3 text-sm hover:bg-primary hover:text-primary-foreground active:bg-primary active:text-primary-foreground transition-colors duration-200 border-b border-border"
						>
							<LogOutIcon className="h-4 w-4" />
							Log out
						</DropdownMenuItem>
					</>
				)}
				{items.map((item) => (
					<DropdownMenuItem key={item.url} asChild>
						{item.url.startsWith("http") ? (
							<a
								href={item.url}
								target="_blank"
								rel="noopener noreferrer"
								className="relative flex w-full cursor-default select-none items-center py-2 px-3 text-sm outline-none focus:bg-primary focus:text-primary-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-primary hover:text-primary-foreground active:bg-primary active:text-primary-foreground transition-colors duration-200"
							>
								{item.name}
							</a>
						) : (
							<Link
								to={item.url}
								className="relative flex w-full cursor-default select-none items-center py-2 px-3 text-sm outline-none focus:bg-primary focus:text-primary-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-primary hover:text-primary-foreground active:bg-primary active:text-primary-foreground transition-colors duration-200"
							>
								{item.name}
							</Link>
						)}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

interface SmartBackButtonProps {
	label: string;
	fallbackPath: string;
	onClick?: () => void;
	onMouseEnter?: () => void;
}

const SmartBackButton = ({ label, fallbackPath, onClick, onMouseEnter }: SmartBackButtonProps) => {
	const navigate = useNavigate();
	const router = useRouter();

	const handleBack = () => {
		// Try to detect if we have meaningful navigation history by checking document.referrer
		// document.referrer is empty when opening via direct link, bookmark, or new tab
		const hasReferrer = document.referrer && document.referrer !== "";
		const referrerIsSameSite =
			hasReferrer &&
			new URL(document.referrer).origin === window.location.origin;

		// If we have same-site referrer and browser history, try going back
		if (referrerIsSameSite && window.history.length > 1) {
			// Use router's back navigation for proper scroll restoration
			router.history.back();
		} else {
			// No referrer or external referrer - navigate directly to fallback
			navigate({ to: fallbackPath });
		}
	};

	const handleClick = onClick || handleBack;

	return (
		<button 
			type="button"
			className="relative flex w-fit rounded-full border border-black bg-background hover:bg-primary hover:text-primary-foreground active:bg-primary active:text-primary-foreground transition-all duration-300 p-[0.3rem] cursor-pointer"
			onClick={handleClick}
			onMouseEnter={onMouseEnter}
		>
			<div className="relative z-10 block px-3 py-1.5 text-xs text-primary-foreground mix-blend-difference md:px-4 md:py-2 md:text-sm">
				← {label}
			</div>
		</button>
	);
};

export function NavBar({
	className,
	userData,
	onActionClick,
}: Omit<NavBarProps, "items">) {
	const router = useRouter();
	const routerState = useRouterState();
	const pathname = router.state.location.pathname;
	const { prefetchStore, prefetchDashboardOrders } = usePrefetch();

	// Keep NavBar silent in production; no-op logs

	const showStoreBackButton =
		routerState.location.pathname.startsWith("/store/") &&
		routerState.location.pathname !== "/store";

	const showHomeBackButton =
		pathname === "/web" ||
		pathname === "/photos" ||
		pathname === "/design" ||
		pathname === "/store";

	const isDashboard = routerState.location.pathname.startsWith("/dashboard");
	const showOther = !isDashboard;

	// Configure action button based on current route
	const getActionButton = () => {
		if (pathname === "/dashboard/products") {
			return {
				label: "Add Product",
				onClick: onActionClick,
			};
		}
		return null;
	};

	const actionButton = getActionButton();

	// Dashboard navigation layout
	if (isDashboard) {
		return (
			<nav
				className={cn(
					"fixed top-0 left-0 right-0 z-[40] px-3 py-3 pointer-events-none",
					className,
				)}
			>
				{/* Mobile: Stack menu and action button */}
				<div className="xl:hidden flex justify-between items-center gap-2 pointer-events-auto">
					<DropdownNavMenu
						items={[...dashboardSecondaryItems, ...dashboardNavItems]}
						showUserInfo={true}
						userData={userData}
					/>
					{actionButton && (
						<button
							type="button"
							onClick={actionButton.onClick}
							className="relative flex w-fit rounded-full border border-black bg-primary text-primary-foreground hover:bg-background hover:text-foreground transition-all duration-300 p-[0.3rem] focus:outline-hidden focus:ring-1 focus:ring-ring whitespace-nowrap"
						>
							<span className="relative z-10 flex items-center gap-1.5 cursor-pointer px-3 py-1.5 text-xs md:px-4 md:py-2 md:text-sm">
								<Plus className="w-4 h-4" />
								{actionButton.label}
							</span>
						</button>
					)}
				</div>

				{/* Desktop: Full width flex with space-between */}
				<div className="hidden xl:flex items-center justify-between gap-2 w-full pointer-events-auto">
					{/* Left: Menu dropdown */}
					<DropdownNavMenu
						items={dashboardSecondaryItems}
						showUserInfo={true}
						userData={userData}
					/>

					{/* Center: Page navigation tabs */}
					<div className="flex w-fit rounded-full border border-primary bg-background p-[0.3rem]">
						{dashboardNavItems.map((item) => (
							<Link
								key={item.url}
								to={item.url}
								onMouseEnter={() => {
									// Prefetch orders data on hover
									if (item.url === "/dashboard/orders") {
										prefetchDashboardOrders();
									}
								}}
								className={cn(
									"relative z-10 block cursor-pointer px-3 xl:px-4 py-1.5 text-xs text-primary-foreground mix-blend-difference xl:py-2 xl:text-sm rounded-full transition-colors",
									pathname === item.url &&
										"bg-primary text-primary-foreground mix-blend-normal",
								)}
							>
								{item.name}
							</Link>
						))}
					</div>

					{/* Right: Action button */}
					{actionButton ? (
						<button
							type="button"
							onClick={actionButton.onClick}
							className="relative flex w-fit rounded-full border border-primary bg-primary text-primary-foreground hover:bg-background hover:text-foreground transition-all duration-300 p-[0.3rem] focus:outline-hidden focus:ring-1 focus:ring-ring whitespace-nowrap"
						>
							<span className="relative z-10 flex items-center gap-1.5 cursor-pointer px-3 py-1.5 text-xs xl:px-4 xl:py-2 xl:text-sm">
								<Plus className="w-4 h-4" />
								{actionButton.label}
							</span>
						</button>
					) : (
						// Placeholder to maintain spacing when no action button
						<div className="w-[120px]" />
					)}
				</div>
			</nav>
		);
	}

	// Client-side navigation layout (existing logic)
	return (
		<nav
			className={cn(
				"fixed top-0 left-0 right-0 z-[40] py-3 flex justify-between items-center px-3 pointer-events-none",
				className,
			)}
		>
			{showOther ? (
				<>
					{/* Left side: Back buttons */}
					<div className="flex items-center gap-3 pointer-events-auto z-50">
						{/* Show SmartBackButton for product pages */}
						{showStoreBackButton && (
							<SmartBackButton 
								label="Обратно в магазин" 
								fallbackPath="/store" 
								onMouseEnter={prefetchStore}
							/>
						)}

						{/* Show SmartBackButton for index pages */}
						{showHomeBackButton && (
							<SmartBackButton label="Главная" fallbackPath="/" />
						)}
					</div>

					{/* Right side: Каталог button */}
					<div className="pointer-events-auto z-50">
						<Button
							to="/store"
							variant="default"
						>
							Каталог
						</Button>
					</div>
				</>
			) : null}
		</nav>
	);
}
