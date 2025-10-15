import * as React from "react";
import { useCursorContext } from "~/components/ui/shared/custom_cursor/CustomCursorContext";
import { useIsMobile } from "~/hooks/use-mobile";
import { cn } from "~/utils/utils";

export interface LinkProps
	extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
	cursorType?:
		| "default"
		| "small"
		| "enlarge"
		| "link"
		| "visitWebsite"
		| "disabled";
	disableCursor?: boolean;
	blurOnHover?: boolean;
	href: string; // Make href required to ensure proper link behavior
}

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
	(
		{
			cursorType = "link",
			disableCursor = false,
			className,
			onMouseEnter,
			onMouseLeave,
			blurOnHover = true,
			...props
		},
		ref,
	) => {
		const { setVariant } = useCursorContext();

		const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
			if (!disableCursor) {
				switch (cursorType) {
					case "link":
						setVariant("link");
						break;
					case "small":
						setVariant("small");
						break;
					case "enlarge":
						setVariant("enlarge");
						break;
					case "visitWebsite":
						setVariant("visitWebsite");
						break;
					case "default":
						setVariant("default");
						break;
					case "disabled":
						// No cursor animation
						break;
				}
			}
			onMouseEnter?.(e);
		};

		const handleMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
			if (!disableCursor && cursorType !== "disabled") {
				setVariant("default");
			}
			onMouseLeave?.(e);
		};

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
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				onKeyDown={handleKeyDown}
				className={cn(
					useIsMobile() ? "cursor-pointer" : "cursor-none",
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
