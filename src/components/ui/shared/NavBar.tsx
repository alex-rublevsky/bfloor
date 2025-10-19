import {
	IconBadgeTm,
	IconBox,
	IconCategory,
	IconPackage,
	IconTags,
} from "@tabler/icons-react";
import {
	Link,
	useNavigate,
	useRouter,
	useRouterState,
} from "@tanstack/react-router";
import {
	ArrowLeftFromLine,
	LogOutIcon,
	MoreVertical,
	Plus,
} from "lucide-react";
import type React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "~/components/ui/DropdownMenu";
import {
	Drawer,
	DrawerContent,
	DrawerTrigger,
} from "~/components/ui/shared/Drawer";
import { SearchInput } from "~/components/ui/shared/SearchInput";
import { usePrefetch } from "~/hooks/usePrefetch";
import { useSearchPlaceholderWithCount } from "~/hooks/useSearchPlaceholderWithCount";
import { useCart } from "~/lib/cartContext";
import { signOut } from "~/utils/auth-client";
import { cn } from "~/utils/utils";
import { CartDrawerContent } from "../store/CartDrawerContent";
import { Button } from "./Button";
import { BottomNavBar } from "./BottomNavBar";
import { Logo } from "./Logo";

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
	// Dashboard header props
	searchTerm?: string;
	onSearchChange?: (value: string) => void;
}

// Dashboard navigation items
const dashboardNavItems: NavItem[] = [
	{ name: "Товары", url: "/dashboard", icon: IconBox },
	{ name: "Категории", url: "/dashboard/categories", icon: IconCategory },
	{ name: "Бренды", url: "/dashboard/brands", icon: IconBadgeTm },
	{ name: "Коллекции", url: "/dashboard/collections", icon: IconCategory },
	{ name: "Атрибуты", url: "/dashboard/attributes", icon: IconTags },
	{ name: "Заказы", url: "/dashboard/orders", icon: IconPackage },
	{ name: "Прочее", url: "/dashboard/misc", icon: IconCategory },
];

const dashboardSecondaryItems: NavItem[] = [
	{ name: "Назад на сайт", url: "/", icon: ArrowLeftFromLine },
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
			<DropdownMenuTrigger className="flex items-center justify-center cursor-pointer p-2 text-foreground hover:text-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50">
				<MoreVertical className="w-5 h-5" />
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
							Выйти
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

// Cart Button Component (copied from CartNav)
const CartButton = () => {
	const { cartOpen, setCartOpen } = useCart();

	return (
		<Drawer open={cartOpen} onOpenChange={setCartOpen}>
			<DrawerTrigger asChild>
				<button
					type="button"
					onClick={() => setCartOpen(true)}
					className="relative flex items-center justify-center w-10 h-10 rounded-full border border-black bg-background hover:bg-primary hover:text-primary-foreground active:bg-primary active:text-primary-foreground transition-all duration-300"
				>
					{/* Cart SVG Icon */}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="w-5 h-5"
						fill="none"
						viewBox="0 0 33 30"
						aria-label="Корзина"
						role="img"
					>
						<title>Корзина</title>
						<path
							d="M1.94531 1.80127H7.27113L11.9244 18.602C12.2844 19.9016 13.4671 20.8013 14.8156 20.8013H25.6376C26.9423 20.8013 28.0974 19.958 28.495 18.7154L31.9453 7.9303H19.0041"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
						<circle cx="13.4453" cy="27.3013" r="2.5" fill="currentColor" />
						<circle cx="26.4453" cy="27.3013" r="2.5" fill="currentColor" />
					</svg>
				</button>
			</DrawerTrigger>
			<DrawerContent>
				<CartDrawerContent />
			</DrawerContent>
		</Drawer>
	);
};

export function NavBar({
	className,
	userData,
	searchTerm,
	onSearchChange,
}: Omit<NavBarProps, "items">) {
	const router = useRouter();
	const routerState = useRouterState();
	const pathname = router.state.location.pathname;
	const { prefetchDashboardOrders } = usePrefetch();
	const dynamicPlaceholder = useSearchPlaceholderWithCount();

	const isDashboard = routerState.location.pathname.startsWith("/dashboard");

	// Handle action button clicks directly
	const handleActionClick = () => {
		// Dispatch a custom event that child routes can listen to
		window.dispatchEvent(new CustomEvent("dashboardAction"));
	};

	// Configure action button based on current route
	const getActionButton = () => {
		if (pathname === "/dashboard") {
			return {
				label: "Добавить товар",
				onClick: handleActionClick,
			};
		}
		if (pathname === "/dashboard/categories") {
			return {
				label: "Добавить категорию",
				onClick: handleActionClick,
			};
		}
		if (pathname === "/dashboard/brands") {
			return {
				label: "Добавить бренд",
				onClick: handleActionClick,
			};
		}
		if (pathname === "/dashboard/collections") {
			return {
				label: "Добавить коллекцию",
				onClick: handleActionClick,
			};
		}
		if (pathname === "/dashboard/attributes") {
			return {
				label: "Добавить атрибут",
				onClick: handleActionClick,
			};
		}
		// Misc page no longer needs navbar action button - it has its own create button
		return null;
	};

	const actionButton = getActionButton();

	// Dashboard navigation layout
	if (isDashboard) {
		return (
			<>
				<nav
					className={cn(
						"fixed top-0 left-0 right-0 z-[40]",
						className,
					)}
				>
				<div className="px-4 py-3">
					{/* Desktop layout - Extra large screens and above */}
					<div className="hidden xl:flex items-center justify-between gap-4">
						{/* Pages navigation - left aligned */}
						<div className="flex-shrink-0">
							<div className="flex rounded-full border border-primary bg-background p-[0.3rem]">
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
											"relative z-10 block cursor-pointer px-3 py-1.5 text-xs text-foreground rounded-full transition-colors hover:bg-primary/20 whitespace-nowrap flex-shrink-0",
											pathname === item.url &&
												"bg-primary text-primary-foreground mix-blend-normal hover:bg-primary",
										)}
									>
										{item.name}
									</Link>
								))}
							</div>
						</div>

						{/* Search + Action button + Menu - grouped together with proper flex behavior */}
						<div className="flex items-center gap-3 flex-shrink-0">
							{/* Search - flexible width */}
							{searchTerm !== undefined && onSearchChange && (
								<SearchInput
									placeholder={dynamicPlaceholder}
									value={searchTerm}
									onChange={onSearchChange}
									className="w-64 min-w-48 max-w-80"
								/>
							)}

							{/* Action button - flexible but with minimum width */}
							{actionButton && (
								<button
									type="button"
									onClick={actionButton.onClick}
									className="relative flex rounded-full border border-primary bg-primary text-primary-foreground hover:bg-background hover:text-foreground transition-all duration-300 p-[0.3rem] focus:outline-hidden focus:ring-1 focus:ring-ring whitespace-nowrap min-w-fit"
								>
									<span className="relative z-10 flex items-center gap-1.5 cursor-pointer px-3 py-1.5 text-xs">
										<Plus className="w-4 h-4" />
										{actionButton.label}
									</span>
								</button>
							)}

							{/* Menu dropdown - fixed size */}
							<div className="flex-shrink-0">
								<DropdownNavMenu
									items={dashboardSecondaryItems}
									showUserInfo={true}
									userData={userData}
								/>
							</div>
						</div>
					</div>

					{/* Desktop layout - Large screens (compact) */}
					<div className="hidden lg:flex xl:hidden items-center justify-between gap-2">
						{/* Pages navigation - left aligned */}
						<div className="flex-shrink-0">
							<div className="flex rounded-full border border-primary bg-background p-[0.3rem]" data-layout="lg">
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
											"relative z-10 block cursor-pointer px-2 py-1.5 text-xs text-foreground rounded-full transition-colors hover:bg-primary/20 whitespace-nowrap flex-shrink-0",
											pathname === item.url &&
												"bg-primary text-primary-foreground mix-blend-normal hover:bg-primary",
										)}
									>
										{item.name}
									</Link>
								))}
							</div>
						</div>

						{/* Search + Action button + Menu - compact */}
						<div className="flex items-center gap-2 flex-shrink-0">
							{/* Search - smaller */}
							{searchTerm !== undefined && onSearchChange && (
								<SearchInput
									placeholder={dynamicPlaceholder}
									value={searchTerm}
									onChange={onSearchChange}
									className="w-48 min-w-40"
								/>
							)}

							{/* Action button - compact */}
							{actionButton && (
								<button
									type="button"
									onClick={actionButton.onClick}
									className="relative flex rounded-full border border-primary bg-primary text-primary-foreground hover:bg-background hover:text-foreground transition-all duration-300 p-[0.3rem] focus:outline-hidden focus:ring-1 focus:ring-ring whitespace-nowrap min-w-fit"
								>
									<span className="relative z-10 flex items-center gap-1 cursor-pointer px-2 py-1.5 text-xs">
										<Plus className="w-3 h-3" />
										<span className="hidden sm:inline">{actionButton.label}</span>
									</span>
								</button>
							)}

							{/* Menu dropdown - fixed size */}
							<div className="flex-shrink-0">
								<DropdownNavMenu
									items={dashboardSecondaryItems}
									showUserInfo={true}
									userData={userData}
								/>
							</div>
						</div>
					</div>

					{/* Tablet layout - Medium screens */}
					<div className="hidden md:flex lg:hidden xl:hidden flex-col gap-3">
						{/* First row: Pages */}
						<div className="flex items-center justify-between gap-4">
							{/* Pages navigation - left aligned */}
							<div className="flex-shrink-0">
								<div className="flex rounded-full border border-primary bg-background p-[0.3rem]" data-layout="md">
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
												"relative z-10 block cursor-pointer px-2 py-1.5 text-xs text-foreground rounded-full transition-colors hover:bg-primary/20 whitespace-nowrap flex-shrink-0",
												pathname === item.url &&
													"bg-primary text-primary-foreground mix-blend-normal hover:bg-primary",
											)}
										>
											{item.name}
										</Link>
									))}
								</div>
							</div>
						</div>

						{/* Second row: Search + Action + Menu */}
						<div className="flex items-center gap-3 w-full min-w-0">
							{/* Search - takes available space */}
							{searchTerm !== undefined && onSearchChange && (
								<SearchInput
									placeholder={dynamicPlaceholder}
									value={searchTerm}
									onChange={onSearchChange}
									className="flex-1 min-w-0"
								/>
							)}

							{/* Action button - flexible but with minimum width */}
							{actionButton && (
								<button
									type="button"
									onClick={actionButton.onClick}
									className="relative flex rounded-full border border-primary bg-primary text-primary-foreground hover:bg-background hover:text-foreground transition-all duration-300 p-[0.3rem] focus:outline-hidden focus:ring-1 focus:ring-ring whitespace-nowrap min-w-fit flex-shrink-0"
								>
									<span className="relative z-10 flex items-center gap-1.5 cursor-pointer px-3 py-1.5 text-xs">
										<Plus className="w-4 h-4" />
										{actionButton.label}
									</span>
								</button>
							)}

							{/* Menu dropdown - fixed size */}
							<div className="flex-shrink-0">
								<DropdownNavMenu
									items={dashboardSecondaryItems}
									showUserInfo={true}
									userData={userData}
								/>
							</div>
						</div>
					</div>

					{/* Mobile layout - Small screens - Always show on mobile */}
					<div className="md:hidden w-full">
						{/* Search - takes full available space */}
						{searchTerm !== undefined && onSearchChange && (
							<SearchInput
								placeholder={dynamicPlaceholder}
								value={searchTerm}
								onChange={onSearchChange}
								className="w-full"
							/>
						)}
					</div>

				</div>
			</nav>

			{/* Bottom Navigation Bar - Mobile only */}
			<BottomNavBar isDashboard={true} actionButton={actionButton} userData={userData} />
		</>
	);
}

	// Client navigation layout
	return (
		<>
			<nav
				className={cn(
					"fixed top-0 left-0 right-0 z-[40] bg-background/95 backdrop-blur-sm border-b border-border",
					className,
				)}
			>
			<div className="px-4 py-3">
				{/* Desktop layout - Large screens and above */}
				<div className="hidden lg:flex items-center justify-between gap-4">
					{/* Logo - stays in place */}
					<div className="flex-shrink-0">
						<Link to="/" className="hover:opacity-80 transition-opacity">
							<Logo className="h-8 w-auto" />
						</Link>
					</div>

					{/* Pages navigation - takes available space */}
					<div className="flex-1 flex justify-center">
						<div className="flex items-center gap-2">
							<Button to="/store" variant="default" size="sm">
								Каталог
							</Button>
						</div>
					</div>

					{/* Cart + Dashboard button - grouped together */}
					<div className="flex items-center gap-3 flex-shrink-0">
						{/* Cart button */}
						<CartButton />

						{/* Dashboard button */}
						<Button to="/dashboard" variant="outline" size="sm">
							Панель управления
						</Button>
					</div>
				</div>

				{/* Tablet layout - Medium screens */}
				<div className="hidden md:flex lg:hidden flex-col gap-3">
					{/* First row: Logo + Pages */}
					<div className="flex items-center justify-between gap-4">
						{/* Logo */}
						<div className="flex-shrink-0">
							<Link to="/" className="hover:opacity-80 transition-opacity">
								<Logo className="h-8 w-auto" />
							</Link>
						</div>

						{/* Pages navigation */}
						<div className="flex-1 flex justify-center">
							<div className="flex items-center gap-2">
								<Button to="/store" variant="default" size="sm">
									Каталог
								</Button>
							</div>
						</div>
					</div>

					{/* Second row: Search + Cart + Dashboard */}
					<div className="flex items-center gap-3 w-full">
						{/* Search - takes available space */}
						<div className="flex-1">
							<input
								type="text"
								placeholder="Поиск..."
								className="w-full px-3 py-2 text-sm border border-border rounded-full bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
							/>
						</div>

						{/* Cart button */}
						<CartButton />

						{/* Dashboard button */}
						<Button to="/dashboard" variant="outline" size="sm">
							Панель управления
						</Button>
					</div>
				</div>

				{/* Mobile layout - Small screens */}
				<div className="md:hidden flex items-center gap-3 w-full">
					{/* Search - takes full available space */}
					<div className="flex-1 min-w-0">
						<input
							type="text"
							placeholder="Поиск..."
							className="w-full px-3 py-2 text-sm border border-border rounded-full bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
						/>
					</div>

					{/* Cart button - fixed width */}
					<CartButton />

					{/* Dashboard button - fixed width */}
					<Button to="/dashboard" variant="outline" size="sm">
						Панель управления
					</Button>
				</div>
			</div>
		</nav>

		{/* Bottom Navigation Bar - Mobile only */}
		<BottomNavBar />
		</>
	);
}
