import * as React from "react";
import { cn } from "~/utils/utils";

export interface LinkProps
	extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
	blurOnHover?: boolean;
	href: string; // Make href required to ensure proper link behavior
}

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
	(
		{ className, onMouseEnter, onMouseLeave, blurOnHover = true, ...props },
		ref,
	) => {
		const handleKeyDown = (e: React.KeyboardEvent<HTMLAnchorElement>) => {
			// Handle Enter and Space key presses for keyboard navigation
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				// Trigger click programmatically
				e.currentTarget.click();
			}
		};

		return (
			// biome-ignore lint/a11y/noStaticElementInteractions: This is a proper interactive link element
			<a
				ref={ref}
				onMouseEnter={onMouseEnter}
				onMouseLeave={onMouseLeave}
				onKeyDown={handleKeyDown}
				className={cn(
					"cursor-pointer",
					blurOnHover ? "blurLink" : undefined,
					className,
				)}
				tabIndex={0}
				{...props}
			/>
		);
	},
);
Link.displayName = "Link";

export { Link };
