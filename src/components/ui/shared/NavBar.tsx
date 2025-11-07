import {
	IconBadgeTm,
	IconBox,
	IconCategory,
	IconPackage,
	IconTags,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
	ArrowLeftFromLine,
	LogOutIcon,
	MoreVertical,
	Plus,
} from "lucide-react";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
	Drawer,
	DrawerContent,
	DrawerTrigger,
} from "~/components/ui/shared/Drawer";
import { SearchInput } from "~/components/ui/shared/SearchInput";
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
import { Logo } from "./Logo";
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
					"relative z-10 block cursor-pointer px-3 py-1.5 text-xs text-foreground rounded-full transition-colors hover:bg-primary/20 whitespace-nowrap flex-shrink-0",
					pathname === item.url &&
						"bg-primary text-primary-foreground mix-blend-normal hover:bg-primary",
				)}
			>
				{item.name}
			</Link>
		))}
	</div>
);

// Reusable action button component
const ActionButton = ({
	actionButton,
	className = "",
}: {
	actionButton: { label: string; onClick: () => void } | null;
	className?: string;
}) => {
	if (!actionButton) return null;

	return (
		<button
			type="button"
			onClick={actionButton.onClick}
			className={cn(
				"relative flex rounded-full border border-primary bg-primary text-primary-foreground hover:bg-background hover:text-foreground transition-all duration-300 p-[0.3rem] focus:outline-hidden focus:ring-1 focus:ring-ring whitespace-nowrap min-w-fit",
				className,
			)}
		>
			<span className="relative z-10 flex items-center gap-1.5 cursor-pointer px-3 py-1.5 text-xs">
				<Plus className="w-4 h-4" />
				{actionButton.label}
			</span>
		</button>
	);
};

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
	const [open, setOpen] = useState<boolean>(false);
	const parent = useRef<HTMLDivElement>(null);
	const child = useRef<HTMLDivElement>(null);
	const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	const userID = userData?.userID || "";
	const userName = userData?.userName || "";
	const userEmail = userData?.userEmail || "";
	const userAvatar = userData?.userAvatar || "";

	const handleMouseLeave = () => {
		closeTimeoutRef.current = setTimeout(() => {
			setOpen(false);
		}, 200);
	};

	const handleMouseEnter = () => {
		if (closeTimeoutRef.current) {
			clearTimeout(closeTimeoutRef.current);
			closeTimeoutRef.current = null;
		}
		setOpen(true);
	};

	useEffect(() => {
		return () => {
			if (closeTimeoutRef.current) {
				clearTimeout(closeTimeoutRef.current);
			}
		};
	}, []);

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
							className="flex w-full items-center gap-2 py-2 px-3 text-sm hover:bg-primary hover:text-primary-foreground active:bg-primary active:text-primary-foreground transition-colors duration-200 border-b border-border cursor-pointer"
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
							className="relative flex w-full cursor-pointer select-none items-center py-2 px-3 text-sm outline-none focus:bg-primary focus:text-primary-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-primary hover:text-primary-foreground active:bg-primary active:text-primary-foreground transition-colors duration-200"
						>
							{item.name}
						</a>
					) : (
						<Link
							key={item.url}
							to={item.url}
							className="relative flex w-full cursor-pointer select-none items-center py-2 px-3 text-sm outline-none focus:bg-primary focus:text-primary-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-primary hover:text-primary-foreground active:bg-primary active:text-primary-foreground transition-colors duration-200"
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
					className="relative flex items-center justify-center w-10 h-10 rounded-full border border-black bg-background hover:bg-primary hover:text-primary-foreground active:bg-primary active:text-primary-foreground transition-all duration-300 cursor-pointer"
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

// Reusable hover dropdown component
const HoverDropdown = ({
	trigger,
	children,
	className = "",
}: {
	trigger: React.ReactNode;
	children: React.ReactNode;
	className?: string;
}) => {
	const [open, setOpen] = useState<boolean>(false);
	const parent = useRef<HTMLDivElement>(null);
	const child = useRef<HTMLDivElement>(null);
	const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	const handleMouseLeave = () => {
		closeTimeoutRef.current = setTimeout(() => {
			setOpen(false);
		}, 200);
	};

	const handleMouseEnter = () => {
		if (closeTimeoutRef.current) {
			clearTimeout(closeTimeoutRef.current);
			closeTimeoutRef.current = null;
		}
		setOpen(true);
	};

	useEffect(() => {
		return () => {
			if (closeTimeoutRef.current) {
				clearTimeout(closeTimeoutRef.current);
			}
		};
	}, []);

	return (
		<div
			ref={parent}
			className={cn("relative", className)}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			role="menu"
		>
			{trigger}
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
				}}
				className="catalog-dropdown-menu"
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
			trigger={
				<a
					href="/contacts"
					className="text-foreground hover:text-primary transition-colors whitespace-nowrap cursor-pointer"
				>
					Владивосток, ул. Русская, д. 78
				</a>
			}
		>
			<div className="px-4 py-3">
				<div className="text-sm font-medium mb-2">Наши адреса</div>
				<div className="space-y-2 text-sm">
					<div>
						<div className="font-medium">Основной магазин</div>
						<div className="text-muted-foreground">
							Владивосток, ул. Русская, д. 78
						</div>
						<div className="text-muted-foreground">Пн-Вс: 10:00 - 20:00</div>
					</div>
					<div className="pt-2 border-t border-border">
						<div className="font-medium">Склад</div>
						<div className="text-muted-foreground">
							Владивосток, ул. Примерная, д. 10
						</div>
						<div className="text-muted-foreground">Пн-Пт: 9:00 - 18:00</div>
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
			trigger={
				<a
					href="tel:+79025559405"
					className="text-foreground hover:text-primary transition-colors whitespace-nowrap cursor-pointer"
				>
					8 902 555 9405
				</a>
			}
		>
			<div className="px-4 py-3">
				<div className="text-sm font-medium mb-2">Контакты</div>
				<div className="space-y-2 text-sm">
					<div>
						<div className="font-medium">Телефон</div>
						<a href="tel:+79025559405" className="text-primary hover:underline">
							+7 (902) 555-94-05
						</a>
					</div>
					<div>
						<div className="font-medium">WhatsApp</div>
						<a
							href="https://wa.me/79025559405"
							className="text-primary hover:underline"
							target="_blank"
							rel="noopener noreferrer"
						>
							+7 (902) 555-94-05
						</a>
					</div>
					<div>
						<div className="font-medium">Email</div>
						<a
							href="mailto:info@example.com"
							className="text-primary hover:underline"
						>
							info@example.com
						</a>
					</div>
					<div className="pt-2 border-t border-border">
						<div className="text-muted-foreground">
							Время работы: Пн-Вс 10:00 - 20:00
						</div>
					</div>
				</div>
			</div>
		</HoverDropdown>
	);
};

// Catalog Dropdown Component with safe triangle
const CatalogDropdown = () => {
	const [open, setOpen] = useState<boolean>(false);
	const parent = useRef<HTMLDivElement>(null);
	const child = useRef<HTMLDivElement>(null);
	const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	const { data: categories = [] } = useQuery({
		...categoriesQueryOptions(),
	});

	// Filter active categories and sort by order
	const activeCategories = categories
		.filter((cat) => cat.isActive)
		.sort((a, b) => a.order - b.order);

	const handleMouseLeave = () => {
		// Delay closing to allow mouse to reach safe area or menu
		// Increased to 200ms to accommodate slower mouse movements
		closeTimeoutRef.current = setTimeout(() => {
			setOpen(false);
		}, 200);
	};

	const handleMouseEnter = () => {
		// Cancel any pending close
		if (closeTimeoutRef.current) {
			clearTimeout(closeTimeoutRef.current);
			closeTimeoutRef.current = null;
		}
		setOpen(true);
	};

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (closeTimeoutRef.current) {
				clearTimeout(closeTimeoutRef.current);
			}
		};
	}, []);

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
							className="block px-4 py-2 text-sm text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
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

	// Fetch userData when on dashboard routes using TanStack Query
	// This is cached and shared across components, no prop drilling needed
	const { data: userData } = useQuery({
		...userDataQueryOptions(),
		enabled: isDashboard, // Only fetch when on dashboard routes
	});

	// Hide-on-scroll state
	const { cartOpen } = useCart();
	const { scrollY } = useScroll();
	const lastYRef = useRef(0);
	const [isHidden, setIsHidden] = useState(false);
	useMotionValueEvent(scrollY, "change", (y) => {
		const difference = y - lastYRef.current;
		if (Math.abs(difference) > 200 && !cartOpen) {
			setIsHidden(difference > 0);
			lastYRef.current = y;
		}
	});

	// Client-side search context
	const clientSearch = useClientSearch();

	// Dashboard search state (self-managed when not provided by props)
	const currentSearchParam = (
		routerState.location.search as unknown as Record<string, unknown>
	)?.search;
	const [typedDashboardSearch, setTypedDashboardSearch] = useState(
		typeof currentSearchParam === "string" ? currentSearchParam : "",
	);

	// Keep internal input in sync with URL changes
	useEffect(() => {
		if (!isDashboard) return;
		setTypedDashboardSearch(
			typeof currentSearchParam === "string" ? currentSearchParam : "",
		);
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
				<motion.nav
					animate={isHidden ? "hidden" : "visible"}
					whileHover="visible"
					onClick={() => setIsHidden(false)}
					onFocusCapture={() => setIsHidden(false)}
					transition={{ duration: 0.5, ease: [0.215, 0.61, 0.355, 1] }}
					variants={{ hidden: { y: "-100%" }, visible: { y: "0%" } }}
					className={cn(
						"sticky top-0 z-[40] bg-background/95 backdrop-blur-sm border-b border-border",
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

							{/* Action button - fixed width */}
							<div className="flex-shrink-0">
								<ActionButton actionButton={actionButton} />
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

								{/* Action button - fixed width */}
								<div className="flex-shrink-0">
									<ActionButton actionButton={actionButton} />
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
				</motion.nav>

				{/* Bottom Navigation Bar - Mobile only */}
				<BottomNavBar
					isDashboard={true}
					actionButton={actionButton}
					userData={userData || undefined}
				/>
			</>
		);
	}

	// Client navigation layout
	return (
		<>
			<motion.nav
				animate={isHidden ? "hidden" : "visible"}
				whileHover="visible"
				onClick={() => setIsHidden(false)}
				onFocusCapture={() => setIsHidden(false)}
				transition={{ duration: 0.5, ease: [0.215, 0.61, 0.355, 1] }}
				variants={{ hidden: { y: "-100%" }, visible: { y: "0%" } }}
				className={cn(
					"sticky top-0 z-[40] bg-background/95 backdrop-blur-sm border-b border-border",
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
									className="text-foreground hover:text-primary transition-colors whitespace-nowrap"
								>
									Доставка и оплата
								</a>
								<a
									href="/contacts"
									className="text-foreground hover:text-primary transition-colors whitespace-nowrap"
								>
									Контакты и адреса
								</a>
								<a
									href="/about"
									className="text-foreground hover:text-primary transition-colors whitespace-nowrap"
								>
									О компании
								</a>
							</div>
						</div>

						{/* Second row: Logo, Catalog, Search, Cart, Dashboard */}
						<div className="flex items-center gap-4">
							{/* Logo - fixed width */}
							<div className="flex-shrink-0">
								<Link to="/" className="hover:opacity-80 transition-opacity">
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
									className="w-full"
								/>
							</div>

							{/* Cart button - fixed width */}
							<div className="flex-shrink-0">
								<CartButton />
							</div>

							{/* Dashboard button - fixed width */}
							<div className="flex-shrink-0">
								<Button to="/dashboard" variant="outline" size="sm">
									Панель управления
								</Button>
							</div>
						</div>
					</div>

					{/* Tablet layout - Medium screens */}
					<div className="hidden md:flex lg:hidden flex-col gap-3">
						{/* First row: Logo + Catalog button */}
						<div className="flex items-center gap-4">
							<div className="flex-shrink-0">
								<Link to="/" className="hover:opacity-80 transition-opacity">
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
									className="w-full"
								/>
							</div>
							<div className="flex-shrink-0">
								<CartButton />
							</div>
							<div className="flex-shrink-0">
								<Button to="/dashboard" variant="outline" size="sm">
									Панель управления
								</Button>
							</div>
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
								className="w-full"
							/>
						</div>

						{/* Cart button - fixed width */}
						<div className="flex-shrink-0">
							<CartButton />
						</div>

						{/* Dashboard button - fixed width */}
						<div className="flex-shrink-0">
							<Button to="/dashboard" variant="outline" size="sm">
								Панель управления
							</Button>
						</div>
					</div>
				</div>
			</motion.nav>

			{/* Bottom Navigation Bar - Mobile only */}
			<BottomNavBar />
		</>
	);
}
