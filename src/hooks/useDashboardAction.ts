import { useEffect } from "react";

/**
 * Hook to listen for dashboard action button clicks from navbar
 * The navbar dispatches a "dashboardAction" event when the floating action button is clicked
 *
 * @param onAction - Callback function to execute when action button is clicked
 *
 * @example
 * ```ts
 * useDashboardAction(() => {
 *   setShowCreateDrawer(true);
 * });
 * ```
 */
export function useDashboardAction(onAction: () => void) {
	useEffect(() => {
		const handleAction = () => {
			onAction();
		};

		window.addEventListener("dashboardAction", handleAction);
		return () => window.removeEventListener("dashboardAction", handleAction);
	}, [onAction]);
}
