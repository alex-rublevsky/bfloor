import { Link as RouterLink } from "@tanstack/react-router";
import * as React from "react";
import { cn } from "~/utils/utils";

export interface LinkProps
	extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
	href: string; // Make href required to ensure proper link behavior
	disableAnimation?: boolean; // Disable animated underline effect
}

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
	(
		{
			className,
			onMouseEnter,
			onMouseLeave,
			children,
			href,
			disableAnimation = false,
			...props
		},
		ref,
	) => {
		// Check if it's an internal link (starts with / and not a special protocol)
		const isInternal =
			href.startsWith("/") &&
			!href.startsWith("//") &&
			!href.startsWith("http://") &&
			!href.startsWith("https://") &&
			!href.startsWith("mailto:") &&
			!href.startsWith("tel:");

		const hasFlex = className?.includes("flex");

		// Render link content - simplified logic
		const renderLinkContent = () => {
			// If animation is disabled, render simple content
			if (disableAnimation) {
				return <span className="link-text">{children}</span>;
			}

			// Separate icon from text for flex layouts (underline only under text)
			if (hasFlex) {
				const childrenArray = React.Children.toArray(children);
				const iconChildren: React.ReactNode[] = [];
				const textChildren: React.ReactNode[] = [];

				childrenArray.forEach((child) => {
					if (React.isValidElement(child) && typeof child.type !== "string") {
						iconChildren.push(child);
					} else {
						textChildren.push(child);
					}
				});

				return (
					<>
						{iconChildren}
						{textChildren.length > 0 && (
							<span className="link-text-wrapper">
								<span className="link-text">{textChildren}</span>
							</span>
						)}
					</>
				);
			}

			// Regular animated underline
			return (
				<span className="link-text-wrapper">
					<span className="link-text">{children}</span>
				</span>
			);
		};

		// Determine className
		const linkClassName = cn(
			"cursor-pointer link",
			!disableAnimation && "link-animated",
			className,
		);

		// Use RouterLink for internal links, regular anchor for external
		if (isInternal) {
			return (
				<RouterLink
					ref={ref}
					to={href}
					onMouseEnter={onMouseEnter}
					onMouseLeave={onMouseLeave}
					className={linkClassName}
					{...props}
				>
					{renderLinkContent()}
				</RouterLink>
			);
		}

		return (
			<a
				ref={ref}
				href={href}
				onMouseEnter={onMouseEnter}
				onMouseLeave={onMouseLeave}
				className={linkClassName}
				{...props}
			>
				{renderLinkContent()}
			</a>
		);
	},
);
Link.displayName = "Link";

export { Link };
