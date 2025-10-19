import { Link, useRouter } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { cn } from "~/utils/utils";

interface BottomNavBarProps {
	className?: string;
	// Dashboard props
	isDashboard?: boolean;
	actionButton?: {
		label: string;
		onClick: () => void;
	} | null;
}

export function BottomNavBar({ className, isDashboard = false, actionButton }: BottomNavBarProps) {
	const router = useRouter();
	const pathname = router.state.location.pathname;

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
