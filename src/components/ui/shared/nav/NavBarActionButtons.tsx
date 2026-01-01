/**
 * Shared action button components for navigation bars
 * Provides consistent styling and behavior across desktop and mobile
 */

import type { ActionButtonConfig } from "~/config/dashboardActionButtons";
import { cn } from "~/utils/utils";
import { Plus } from "../Icon";

interface ActionButtonProps {
	button: ActionButtonConfig;
	className?: string;
	showIcon?: boolean;
}

/**
 * Single action button component
 */
export function ActionButton({
	button,
	className = "",
	showIcon = true,
}: ActionButtonProps) {
	const isPrimary = button.variant === "default";

	return (
		<button
			type="button"
			onClick={button.onClick}
			className={cn(
				"relative flex rounded-full border transition-standard p-[0.3rem] focus:outline-hidden focus:ring-1 focus:ring-ring whitespace-nowrap min-w-fit",
				isPrimary
					? "border-primary bg-primary text-primary-foreground hover:bg-background hover:text-foreground"
					: "border-border bg-background text-foreground hover:bg-muted",
				className,
			)}
		>
			<span className="relative z-10 flex items-center gap-1.5 cursor-pointer px-3 py-1.5 text-xs">
				{isPrimary && showIcon && <Plus className="w-4 h-4" />}
				{button.label}
			</span>
		</button>
	);
}

interface ActionButtonsProps {
	buttons: ActionButtonConfig[];
	className?: string;
	showIcon?: boolean;
}

/**
 * Multiple action buttons component
 * Renders buttons horizontally with consistent spacing
 */
export function ActionButtons({
	buttons,
	className = "",
	showIcon = true,
}: ActionButtonsProps) {
	if (buttons.length === 0) return null;

	return (
		<div className={cn("flex items-center gap-2", className)}>
			{buttons.map((button, index) => (
				<ActionButton
					key={`nav-action-${index}-${button.label}`}
					button={button}
					showIcon={showIcon}
				/>
			))}
		</div>
	);
}

/**
 * Mobile floating action button component
 * Used in BottomNavBar for dashboard actions
 */
interface MobileActionButtonProps {
	button: ActionButtonConfig;
	position: "left" | "right";
	className?: string;
}

export function MobileActionButton({
	button,
	position,
	className = "",
}: MobileActionButtonProps) {
	const isPrimary = button.variant === "default";

	return (
		<button
			type="button"
			onClick={button.onClick}
			className={cn(
				"md:hidden fixed bottom-22 z-50 rounded-full whitespace-nowrap transition-standard",
				position === "left" ? "left-2" : "right-2",
				isPrimary
					? "bg-primary text-primary-foreground hover:bg-primary/90"
					: "bg-background text-foreground border border-border hover:bg-muted",
				className,
			)}
			aria-label={button.label}
		>
			<span className="flex items-center gap-1.5 px-3 py-1.5 text-xs">
				{isPrimary && <Plus className="w-4 h-4" />}
				{button.label}
			</span>
		</button>
	);
}

/**
 * Mobile floating action buttons container
 * Handles positioning for single or multiple buttons
 */
interface MobileActionButtonsProps {
	buttons: ActionButtonConfig[];
}

export function MobileActionButtons({ buttons }: MobileActionButtonsProps) {
	if (buttons.length === 0) return null;

	if (buttons.length === 1) {
		return <MobileActionButton button={buttons[0]} position="right" />;
	}

	// Multiple buttons: Cancel on left, Primary on right
	return (
		<>
			{buttons.map((button, index) => {
				const isCancel = button.variant === "outline";
				return (
					<MobileActionButton
						key={`mobile-action-${index}-${button.label}`}
						button={button}
						position={isCancel ? "left" : "right"}
					/>
				);
			})}
		</>
	);
}
