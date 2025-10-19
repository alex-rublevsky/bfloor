import { Link, useRouter, useNavigate } from "@tanstack/react-router";
import { Plus, MoreVertical } from "lucide-react";
import { useState } from "react";
import { cn } from "~/utils/utils";
import { signOut } from "~/utils/auth-client";

interface BottomNavBarProps {
	className?: string;
	// Dashboard props
	isDashboard?: boolean;
	actionButton?: {
		label: string;
		onClick: () => void;
	} | null;
	// User data for dashboard menu
	userData?: {
		userID: string;
		userName: string;
		userEmail: string;
		userAvatar: string;
	};
}

export function BottomNavBar({ className, isDashboard = false, actionButton, userData }: BottomNavBarProps) {
	const router = useRouter();
	const navigate = useNavigate();
	const pathname = router.state.location.pathname;
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	// Dashboard navigation items for mobile bottom bar - only Products and Orders
	const dashboardMobileItems = [
		{ name: "Товары", url: "/dashboard", icon: "📦" },
		{ name: "Заказы", url: "/dashboard/orders", icon: "📋" },
	];

	// Dashboard menu items (everything else)
	const dashboardMenuItems = [
		{ name: "Категории", url: "/dashboard/categories", icon: "📂" },
		{ name: "Бренды", url: "/dashboard/brands", icon: "🏷️" },
		{ name: "Коллекции", url: "/dashboard/collections", icon: "📁" },
		{ name: "Атрибуты", url: "/dashboard/attributes", icon: "🏷️" },
		{ name: "Прочее", url: "/dashboard/misc", icon: "⚙️" },
		{ name: "Назад на сайт", url: "/", icon: "🏠" },
	];

	const handleLogout = async () => {
		try {
			await signOut();
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
	};

	return (
		<>
			{/* Bottom Navigation Bar - Mobile only */}
			<nav
				className={cn(
					"fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-t border-border md:hidden",
					className,
				)}
			>
				<div className="px-4 py-2">
					{isDashboard ? (
						/* Dashboard Mobile Navigation */
						<div className="flex items-center justify-center gap-8">
							{/* Products and Orders */}
							{dashboardMobileItems.map((item) => (
								<Link
									key={item.url}
									to={item.url}
									className={cn(
										"flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors min-w-0",
										pathname === item.url
											? "text-primary bg-primary/10"
											: "text-muted-foreground hover:text-foreground hover:bg-muted"
									)}
								>
									<span className="text-lg">
										{item.icon}
									</span>
									<span className="text-xs font-medium text-center leading-tight">
										{item.name}
									</span>
								</Link>
							))}

							{/* Menu Button */}
							<div className="relative">
								<button
									type="button"
									onClick={() => setIsMenuOpen(!isMenuOpen)}
									className={cn(
										"flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors",
										isMenuOpen
											? "text-primary bg-primary/10"
											: "text-muted-foreground hover:text-foreground hover:bg-muted"
									)}
								>
									<MoreVertical className="w-5 h-5" />
									<span className="text-xs font-medium">Меню</span>
								</button>

								{/* Menu Popover */}
								{isMenuOpen && (
									<div className="absolute bottom-full right-0 mb-2 w-64 bg-background border border-border rounded-lg shadow-lg z-50">
										<div className="py-2">
											{/* User Info */}
											{userData && (
												<>
													<div className="flex items-center gap-2 px-4 py-2 border-b border-border">
														<div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
															{userData.userName ? userData.userName.charAt(0).toUpperCase() : "U"}
														</div>
														<div className="flex-1 min-w-0">
															<div className="text-sm font-medium truncate">
																{userData.userName || userData.userID}
															</div>
															<div className="text-xs text-muted-foreground truncate">
																{userData.userEmail}
															</div>
														</div>
													</div>
												</>
											)}

											{/* Menu Items */}
											{dashboardMenuItems.map((item) => (
												<Link
													key={item.url}
													to={item.url}
													onClick={() => setIsMenuOpen(false)}
													className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
												>
													<span className="text-base">{item.icon}</span>
													<span>{item.name}</span>
												</Link>
											))}

											{/* Divider */}
											<div className="border-t border-border my-1" />

											{/* Logout */}
											<button
												type="button"
												onClick={() => {
													setIsMenuOpen(false);
													handleLogout();
												}}
												className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors w-full text-left"
											>
												<span className="text-base">🚪</span>
												<span>Выйти</span>
											</button>
										</div>
									</div>
								)}
							</div>
						</div>
					) : (
						/* Client-side Mobile Navigation */
						<div className="flex items-center justify-center gap-8">
							{/* Catalog Button */}
							<Link
								to="/store"
								className={cn(
									"flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors",
									pathname === "/store"
										? "text-primary bg-primary/10"
										: "text-muted-foreground hover:text-foreground hover:bg-muted"
								)}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="w-5 h-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									strokeWidth={2}
									aria-label="Каталог"
								>
									<title>Каталог</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
									/>
								</svg>
								<span className="text-xs font-medium">Каталог</span>
							</Link>

							{/* Contact Button */}
							<Link
								to="/contact"
								className={cn(
									"flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors",
									pathname === "/contact"
										? "text-primary bg-primary/10"
										: "text-muted-foreground hover:text-foreground hover:bg-muted"
								)}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="w-5 h-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									strokeWidth={2}
									aria-label="Контакты"
								>
									<title>Контакты</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
									/>
								</svg>
								<span className="text-xs font-medium">Контакты</span>
							</Link>
						</div>
					)}
				</div>
			</nav>

			{/* Floating Action Button - Dashboard only, Mobile only */}
			{isDashboard && actionButton && (
				<button
					type="button"
					onClick={actionButton.onClick}
					className="md:hidden fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 flex items-center justify-center"
					aria-label={actionButton.label}
				>
					<Plus className="w-6 h-6" />
				</button>
			)}
		</>
	);
}
