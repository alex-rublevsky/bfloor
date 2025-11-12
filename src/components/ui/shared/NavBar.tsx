import {
	IconBadgeTm,
	IconBox,
	IconCategory,
	IconPackage,
	IconTags,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ArrowLeftFromLine, LogOutIcon, MoreVertical } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
	Drawer,
	DrawerContent,
	DrawerTrigger,
} from "~/components/ui/shared/Drawer";
import { SearchInput } from "~/components/ui/shared/SearchInput";
import { getActionButtonsForRoute } from "~/config/dashboardActionButtons";
import { useHoverDropdown } from "~/hooks/useHoverDropdown";
import { usePrefetch } from "~/hooks/usePrefetch";
import { useSearchPlaceholderWithCount } from "~/hooks/useSearchPlaceholderWithCount";
import { useCart } from "~/lib/cartContext";
import { useClientSearch } from "~/lib/clientSearchContext";
import {
	categoriesQueryOptions,
	userDataQueryOptions,
} from "~/lib/queryOptions";
import { signOut } from "~/utils/auth-client";
import { cn } from "~/utils/utils";
import { CartDrawerContent } from "../store/CartDrawerContent";
import { BottomNavBar } from "./BottomNavBar";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { Logo } from "./Logo";
import { ActionButton, ActionButtons } from "./nav/NavBarActionButtons";
import { SafeArea } from "./SafeArea";

interface NavItem {
	name: string;
	url: string;
	icon?: React.ComponentType;
}

interface NavBarProps {
	items?: NavItem[];
	className?: string;
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

// Reusable dashboard navigation component
const DashboardNavLinks = ({
	className = "",
	dashboardNavItems,
	pathname,
	prefetchDashboardOrders,
}: {
	className?: string;
	dashboardNavItems: NavItem[];
	pathname: string;
	prefetchDashboardOrders: () => void;
}) => (
	<div
		className={cn(
			"flex  rounded-full border  border-border bg-background p-[0.3rem]",
			className,
		)}
	>
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
					"relative z-10 block cursor-pointer px-3 py-1.5 text-xs text-foreground rounded-full transition-standard hover:bg-primary/20 whitespace-nowrap flex-shrink-0",
					pathname === item.url &&
						"bg-primary text-primary-foreground mix-blend-normal hover:bg-primary",
				)}
			>
				{item.name}
			</Link>
		))}
	</div>
);

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
	const {
		isOpen: open,
		parentRef: parent,
		childRef: child,
		handleMouseEnter,
		handleMouseLeave,
	} = useHoverDropdown();

	const userID = userData?.userID || "";
	const userName = userData?.userName || "";
	const userEmail = userData?.userEmail || "";
	const userAvatar = userData?.userAvatar || "";

	return (
		<div
			ref={parent}
			className="relative"
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			role="menu"
		>
			<button
				type="button"
				className="flex items-center justify-center cursor-pointer p-2 text-foreground hover:text-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
			>
				<MoreVertical className="w-5 h-5" />
			</button>
			{/* Safe mouse area - SVG triangle */}
			{open && parent.current && child.current && (
				<SafeArea
					anchor={parent.current}
					submenu={child.current}
					onMouseEnter={handleMouseEnter}
				/>
			)}
			{/* Dropdown menu - positioned below */}
			<div
				ref={child}
				style={{
					visibility: open ? "visible" : "hidden",
					opacity: open ? 1 : 0,
					position: "absolute",
					right: 0,
					top: "100%",
					marginTop: "0.5rem",
				}}
				className="catalog-dropdown-menu catalog-dropdown-menu-single-column"
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				role="menu"
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
						<button
							type="button"
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
							className="flex w-full items-center gap-2 py-2 px-3 text-sm hover:bg-primary hover:text-primary-foreground active:bg-primary active:text-primary-foreground transition-standard border-b border-border cursor-pointer"
						>
							<LogOutIcon className="h-4 w-4" />
							Выйти
						</button>
					</>
				)}
				{items.map((item) =>
					item.url.startsWith("http") ? (
						<a
							key={item.url}
							href={item.url}
							target="_blank"
							rel="noopener noreferrer"
							className="relative flex w-full cursor-pointer select-none items-center py-2 px-3 text-sm outline-none focus:bg-primary focus:text-primary-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-primary hover:text-primary-foreground active:bg-primary active:text-primary-foreground transition-standard"
						>
							{item.name}
						</a>
					) : (
						<Link
							key={item.url}
							to={item.url}
							className="relative flex w-full cursor-pointer select-none items-center py-2 px-3 text-sm outline-none focus:bg-primary focus:text-primary-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-primary hover:text-primary-foreground active:bg-primary active:text-primary-foreground transition-standard"
						>
							{item.name}
						</Link>
					),
				)}
			</div>
		</div>
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
					className="relative flex items-center justify-center text-accent hover:text-accent transition-standard cursor-pointer"
				>
					{/* Cart SVG Icon */}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="w-6 h-6"
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

// Reusable hover dropdown component
const HoverDropdown = ({
	trigger,
	children,
	className = "",
	menuClassName = "",
}: {
	trigger: React.ReactNode | ((isOpen: boolean) => React.ReactNode);
	children: React.ReactNode;
	className?: string;
	menuClassName?: string;
}) => {
	const {
		isOpen: open,
		parentRef: parent,
		childRef: child,
		handleMouseEnter,
		handleMouseLeave,
	} = useHoverDropdown();

	return (
		<div
			ref={parent}
			className={cn("relative", className)}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			role="menu"
		>
			{typeof trigger === "function" ? trigger(open) : trigger}
			{open && parent.current && child.current && (
				<SafeArea
					anchor={parent.current}
					submenu={child.current}
					onMouseEnter={handleMouseEnter}
				/>
			)}
			<div
				ref={child}
				style={{
					visibility: open ? "visible" : "hidden",
					opacity: open ? 1 : 0,
					position: "absolute",
					left: 0,
					top: "100%",
					marginTop: "0.5rem",
					...(menuClassName.includes("!w-fit") && {
						width: "fit-content",
						minWidth: "fit-content",
					}),
				}}
				className={cn("catalog-dropdown-menu", menuClassName)}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				role="menu"
			>
				{children}
			</div>
		</div>
	);
};

// Address Dropdown Component
const AddressDropdown = () => {
	return (
		<HoverDropdown
			menuClassName="!w-fit !min-w-fit columns-1"
			trigger={(isOpen) => (
				<a
					href="/contacts"
					className="flex items-center gap-1.5 text-foreground hover:text-primary transition-standard whitespace-nowrap cursor-pointer"
				>
					<Icon
						name="chevron-down"
						size={16}
						className={cn(
							"text-accent transition-faster",
							isOpen && "rotate-180",
						)}
					/>
					ул. Русская, 78
				</a>
			)}
		>
			<div className="px-4 py-3">
				<div className="space-y-3 text-sm">
					<div className="flex gap-3">
						<div>
							<div className="font-medium mb-1 whitespace-nowrap">
								ул. Русская, 78
							</div>
							<div className="text-muted-foreground space-y-0.5">
								<div className="flex justify-between items-center gap-2">
									<span className="whitespace-nowrap">Пн — Пт</span>
									<span className="whitespace-nowrap">10 — 18</span>
								</div>
								<div className="flex justify-between items-center gap-2">
									<span className="whitespace-nowrap">Сб</span>
									<span className="whitespace-nowrap">11 — 17</span>
								</div>
								<div className="flex justify-between items-center gap-2">
									<span className="whitespace-nowrap">Вс</span>
									<span className="whitespace-nowrap">Выходной</span>
								</div>
							</div>
						</div>
						<div>
							<div className="font-medium mb-1 whitespace-nowrap">
								ул. 100 летия, 30
							</div>
							<div className="text-muted-foreground space-y-0.5">
								<div className="flex justify-between items-center gap-2">
									<span className="whitespace-nowrap">Пн — Пт</span>
									<span className="whitespace-nowrap">10 — 18</span>
								</div>
								<div className="flex justify-between items-center gap-2">
									<span className="whitespace-nowrap">Сб</span>
									<span className="whitespace-nowrap">11 — 17</span>
								</div>
								<div className="flex justify-between items-center gap-2">
									<span className="whitespace-nowrap">Вс</span>
									<span className="whitespace-nowrap">Выходной</span>
								</div>
							</div>
						</div>
					</div>
					<div className="pt-3 border-t border-border">
						<Link
							to="/contacts"
							className="block text-center py-2 px-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-standard"
						>
							Адреса
						</Link>
					</div>
				</div>
			</div>
		</HoverDropdown>
	);
};

// Phone Dropdown Component
const PhoneDropdown = () => {
	return (
		<HoverDropdown
			menuClassName="!w-fit !min-w-fit columns-1"
			trigger={(isOpen) => (
				<a
					href="tel:+79084466740"
					className="flex items-center gap-1.5 text-foreground hover:text-primary transition-standard whitespace-nowrap cursor-pointer"
				>
					<Icon
						name="chevron-down"
						size={16}
						className={cn(
							"text-accent transition-faster",
							isOpen && "rotate-180",
						)}
					/>
					8 908 446 6740
				</a>
			)}
		>
			<div className="px-4 py-3">
				<div className="flex gap-4 items-start">
					{/* Left column - Contact info */}
					<div className="space-y-2 text-sm">
						<div>
							<a
								href="tel:+79084466740"
								className="text-primary hover:underline block"
							>
								8 908 446 6740
							</a>
						</div>
						<div>
							<a
								href="tel:+79025559405"
								className="text-primary hover:underline block"
							>
								8 902 555 9405
							</a>
						</div>
						<div>
							<a
								href="tel:+79084486785"
								className="text-primary hover:underline block"
							>
								8 908 448 6785
							</a>
						</div>
						<div>
							<a
								href="mailto:romavg@mail.ru"
								className="text-primary hover:underline block"
							>
								romavg@mail.ru
							</a>
						</div>
					</div>
					{/* Right column - Social icons */}
					<div className="flex flex-col gap-2 items-center">
						<a
							href="https://t.me/your_telegram"
							target="_blank"
							rel="noopener noreferrer"
							className="text-accent hover:opacity-80 transition-faster"
							aria-label="Telegram"
						>
							<Icon name="telegram" size={36} className="text-accent" />
						</a>
						<a
							href="https://instagram.com/your_instagram"
							target="_blank"
							rel="noopener noreferrer"
							className="text-accent hover:opacity-80 transition-faster"
							aria-label="Instagram"
						>
							<Icon name="instagram" size={36} className="text-accent" />
						</a>
						<a
							href="https://wa.me/79084466740"
							target="_blank"
							rel="noopener noreferrer"
							className="text-accent hover:opacity-80 transition-faster"
							aria-label="WhatsApp"
						>
							<Icon name="whatsapp" size={36} className="text-accent" />
						</a>
					</div>
				</div>
			</div>
		</HoverDropdown>
	);
};

// Catalog Dropdown Component with safe triangle
const CatalogDropdown = () => {
	const {
		isOpen: open,
		parentRef: parent,
		childRef: child,
		handleMouseEnter,
		handleMouseLeave,
	} = useHoverDropdown();

	const { data: categories = [] } = useQuery({
		...categoriesQueryOptions(),
	});

	// Filter active categories and sort by order
	const activeCategories = categories
		.filter((cat) => cat.isActive)
		.sort((a, b) => a.order - b.order);

	return (
		<div
			ref={parent}
			className="relative catalog-dropdown-container"
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			role="menu"
		>
			<Button to="/store" variant="accent" size="sm">
				Каталог
			</Button>
			{/* Safe mouse area - SVG triangle */}
			{open && parent.current && child.current && (
				<SafeArea
					anchor={parent.current}
					submenu={child.current}
					onMouseEnter={handleMouseEnter}
				/>
			)}
			{/* Dropdown menu - hidden by default, shown on hover (desktop only) */}
			<div
				ref={child}
				style={{
					visibility: open ? "visible" : "hidden",
					opacity: open ? 1 : 0,
					position: "absolute",
					left: 0,
					top: "100%",
					marginTop: "0.5rem",
				}}
				className="catalog-dropdown-menu"
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				role="menu"
			>
				{activeCategories.length === 0 ? (
					<div className="px-4 py-2 text-sm text-muted-foreground">
						Нет категорий
					</div>
				) : (
					activeCategories.map((category) => (
						<Link
							key={category.slug}
							to="/store"
							search={{ category: category.slug }}
							className="block px-4 py-2 text-sm text-foreground hover:bg-primary hover:text-primary-foreground transition-standard"
						>
							{category.name}
						</Link>
					))
				)}
			</div>
		</div>
	);
};

export function NavBar({
	className,
	searchTerm,
	onSearchChange,
}: Omit<NavBarProps, "items">) {
	const routerState = useRouterState();
	const pathname = routerState.location.pathname;
	const { prefetchDashboardOrders } = usePrefetch();
	const dynamicPlaceholder = useSearchPlaceholderWithCount();

	const isDashboard = pathname.startsWith("/dashboard");
	const isMiscPage = pathname === "/dashboard/misc";

	// Fetch userData using TanStack Query
	// This is cached and shared across components, no prop drilling needed
	const { data: userData } = useQuery({
		...userDataQueryOptions(),
	});

	// Check if user is admin
	const isAdmin = userData?.isAdmin ?? false;

	// Client-side search context
	const clientSearch = useClientSearch();
	const navigate = useNavigate();

	// Dashboard search state (self-managed when not provided by props)
	const currentSearchParam = (
		routerState.location.search as unknown as Record<string, unknown>
	)?.search;
	const [typedDashboardSearch, setTypedDashboardSearch] = useState(() => {
		// Handle both string and number (numeric strings can be parsed as numbers by the router)
		if (typeof currentSearchParam === "string") return currentSearchParam;
		if (typeof currentSearchParam === "number")
			return String(currentSearchParam);
		return "";
	});

	// Keep internal input in sync with URL changes
	useEffect(() => {
		if (!isDashboard) return;
		// Handle both string and number (numeric strings can be parsed as numbers by the router)
		const searchValue =
			typeof currentSearchParam === "string"
				? currentSearchParam
				: typeof currentSearchParam === "number"
					? String(currentSearchParam)
					: "";
		setTypedDashboardSearch(searchValue);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isDashboard, currentSearchParam]);

	// Debounce URL update when using internal dashboard search
	useEffect(() => {
		if (!isDashboard || isMiscPage) return;
		// If parent provides controlled search, do nothing here
		if (searchTerm !== undefined && onSearchChange) return;
		const normalized = typedDashboardSearch.trim().replace(/\s+/g, " ");
		const applied = normalized.length >= 2 ? normalized : undefined;
		const handle = setTimeout(() => {
			const url = new URL(window.location.href);
			if (applied) {
				url.searchParams.set("search", applied);
			} else {
				url.searchParams.delete("search");
			}
			window.history.replaceState(null, "", url.toString());
		}, 400);
		return () => clearTimeout(handle);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		isDashboard,
		isMiscPage,
		typedDashboardSearch,
		searchTerm,
		onSearchChange,
	]);

	// Get action buttons from configuration
	const actionButtons = getActionButtonsForRoute(pathname);
	const actionButton = actionButtons.length === 1 ? actionButtons[0] : null;

	// Dashboard navigation layout
	if (isDashboard) {
		return (
			<>
				<nav
					className={cn(
						"sticky top-0 z-[100] bg-background/95 backdrop-blur-sm border-b border-border",
						className,
					)}
				>
					<div className="px-4 py-3">
						{/* Desktop layout - Large screens and above */}
						<div className="hidden lg:flex items-center gap-4">
							{/* Pages navigation - fixed width */}
							<div className="flex-shrink-0">
								<DashboardNavLinks
									dashboardNavItems={dashboardNavItems}
									pathname={pathname}
									prefetchDashboardOrders={prefetchDashboardOrders}
								/>
							</div>

							{/* Search - takes all available space (dashboard) */}
							{!isMiscPage && (
								<div className="flex-1 min-w-0">
									<SearchInput
										placeholder={dynamicPlaceholder}
										value={
											searchTerm !== undefined && onSearchChange
												? searchTerm
												: typedDashboardSearch
										}
										onChange={
											searchTerm !== undefined && onSearchChange
												? onSearchChange
												: setTypedDashboardSearch
										}
										className="w-full"
									/>
								</div>
							)}

							{/* Action button(s) - fixed width */}
							<div className="flex-shrink-0">
								{actionButtons.length > 1 ? (
									<ActionButtons buttons={actionButtons} />
								) : actionButton ? (
									<ActionButton button={actionButton} />
								) : null}
							</div>

							{/* Menu dropdown - fixed width */}
							<div className="flex-shrink-0">
								<DropdownNavMenu
									items={dashboardSecondaryItems}
									showUserInfo={true}
									userData={userData || undefined}
								/>
							</div>
						</div>

						{/* Tablet layout - Medium screens */}
						<div className="hidden md:flex lg:hidden flex-col gap-3">
							{/* First row: Pages navigation */}
							<div className="flex-shrink-0">
								<DashboardNavLinks
									dashboardNavItems={dashboardNavItems}
									pathname={pathname}
									prefetchDashboardOrders={prefetchDashboardOrders}
								/>
							</div>

							{/* Second row: Search + Action + Menu */}
							<div className="flex items-center gap-3">
								{/* Search - takes available space (dashboard) */}
								{!isMiscPage && (
									<div className="flex-1 min-w-0">
										<SearchInput
											placeholder={dynamicPlaceholder}
											value={
												searchTerm !== undefined && onSearchChange
													? searchTerm
													: typedDashboardSearch
											}
											onChange={
												searchTerm !== undefined && onSearchChange
													? onSearchChange
													: setTypedDashboardSearch
											}
											className="w-full"
										/>
									</div>
								)}

								{/* Action button(s) - fixed width */}
								<div className="flex-shrink-0">
									{actionButtons.length > 1 ? (
										<ActionButtons buttons={actionButtons} />
									) : actionButton ? (
										<ActionButton button={actionButton} />
									) : null}
								</div>

								{/* Menu dropdown - fixed width */}
								<div className="flex-shrink-0">
									<DropdownNavMenu
										items={dashboardSecondaryItems}
										showUserInfo={true}
										userData={userData || undefined}
									/>
								</div>
							</div>
						</div>

						{/* Mobile layout - Small screens */}
						<div className="md:hidden w-full">
							{/* Search - takes full available space (dashboard) */}
							{!isMiscPage && (
								<SearchInput
									placeholder={dynamicPlaceholder}
									value={
										searchTerm !== undefined && onSearchChange
											? searchTerm
											: typedDashboardSearch
									}
									onChange={
										searchTerm !== undefined && onSearchChange
											? onSearchChange
											: setTypedDashboardSearch
									}
									className="w-full"
								/>
							)}
						</div>
					</div>
				</nav>

				{/* Bottom Navigation Bar - Mobile only */}
				<BottomNavBar
					isDashboard={true}
					actionButtons={actionButtons}
					userData={userData || undefined}
				/>
			</>
		);
	}

	// Client navigation layout
	return (
		<>
			<nav
				style={{ viewTransitionName: "--persist-nav" }}
				className={cn(
					"sticky top-0 z-[100] bg-background/95 backdrop-blur-sm border-b border-border",
					className,
				)}
			>
				<div className="px-4 py-3">
					{/* Desktop layout - Large screens and above */}
					<div className="hidden lg:flex flex-col gap-3">
						{/* First row: Navigation Links */}
						<div className="flex items-center justify-between gap-3 text-sm flex-wrap">
							<AddressDropdown />
							<PhoneDropdown />
							<div className="flex items-center gap-3">
								<a
									href="/delivery"
									className="text-foreground hover:text-primary transition-standard whitespace-nowrap"
								>
									Доставка и оплата
								</a>
								<a
									href="/contacts"
									className="text-foreground hover:text-primary transition-standard whitespace-nowrap"
								>
									Контакты и адреса
								</a>
								<a
									href="/about"
									className="text-foreground hover:text-primary transition-standard whitespace-nowrap"
								>
									О компании
								</a>
							</div>
						</div>

						{/* Second row: Logo, Catalog, Search, Cart, Dashboard */}
						<div className="flex items-center gap-4">
							{/* Logo - fixed width */}
							<div className="flex-shrink-0">
								<Link to="/" className="hover:opacity-80 transition-standard">
									<Logo className="h-8 w-auto" />
								</Link>
							</div>

							{/* Catalog button with dropdown - fixed width */}
							<div className="flex-shrink-0">
								<CatalogDropdown />
							</div>

							{/* Search - takes all available space */}
							<div className="flex-1 min-w-0">
								<SearchInput
									placeholder={dynamicPlaceholder || "Поиск..."}
									value={clientSearch.searchTerm}
									onChange={clientSearch.setSearchTerm}
									onSubmit={(value) => {
										const trimmed = value.trim();
										if (trimmed.length >= 2) {
											// Navigate to store page if not already there
											if (pathname !== "/store") {
												navigate({ to: "/store" });
											}
										}
									}}
									className="w-full"
								/>
							</div>

							{/* Cart button - fixed width */}
							<div className="flex-shrink-0">
								<CartButton />
							</div>

							{/* Dashboard button - fixed width (only for admins) */}
							{isAdmin && (
								<div className="flex-shrink-0">
									<Button to="/dashboard" variant="secondary" size="sm">
										Админка
									</Button>
								</div>
							)}
						</div>
					</div>

					{/* Tablet layout - Medium screens */}
					<div className="hidden md:flex lg:hidden flex-col gap-3">
						{/* First row: Logo + Catalog button */}
						<div className="flex items-center gap-4">
							<div className="flex-shrink-0">
								<Link to="/" className="hover:opacity-80 transition-standard">
									<Logo className="h-8 w-auto" />
								</Link>
							</div>
							<div className="flex-shrink-0">
								<CatalogDropdown />
							</div>
						</div>

						{/* Second row: Search + Cart + Dashboard */}
						<div className="flex items-center gap-3">
							<div className="flex-1 min-w-0">
								<SearchInput
									placeholder={dynamicPlaceholder || "Поиск..."}
									value={clientSearch.searchTerm}
									onChange={clientSearch.setSearchTerm}
									onSubmit={(value) => {
										const trimmed = value.trim();
										if (trimmed.length >= 2) {
											// Navigate to store page if not already there
											if (pathname !== "/store") {
												navigate({ to: "/store" });
											}
										}
									}}
									className="w-full"
								/>
							</div>
							<div className="flex-shrink-0">
								<CartButton />
							</div>
							{isAdmin && (
								<div className="flex-shrink-0">
									<Button to="/dashboard" variant="secondary" size="sm">
										Админка
									</Button>
								</div>
							)}
						</div>
					</div>

					{/* Mobile layout - Small screens */}
					<div className="md:hidden flex items-center gap-3">
						{/* Search - takes full available space */}
						<div className="flex-1 min-w-0">
							<SearchInput
								placeholder={dynamicPlaceholder || "Поиск..."}
								value={clientSearch.searchTerm}
								onChange={clientSearch.setSearchTerm}
								onSubmit={(value) => {
									const trimmed = value.trim();
									if (trimmed.length >= 2) {
										// Navigate to store page if not already there
										if (pathname !== "/store") {
											navigate({ to: "/store" });
										}
									}
								}}
								className="w-full"
							/>
						</div>

						{/* Dashboard button - fixed width (only for admins) */}
						{isAdmin && (
							<div className="flex-shrink-0">
								<Button to="/dashboard" variant="secondary" size="sm">
									Админка
								</Button>
							</div>
						)}
					</div>
				</div>
			</nav>

			{/* Bottom Navigation Bar - Mobile only */}
			<BottomNavBar />
		</>
	);
}
