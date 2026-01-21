import { Link as RouterLink } from "@tanstack/react-router";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "~/utils/utils";

const linkVariants = cva(
	"cursor-pointer link text-foreground transition-standard whitespace-nowrap",
	{
		variants: {
			variant: {
				default: "",
				category:
					"whitespace-normal! flex items-center justify-between w-full px-4 py-2 text-sm text-foreground hover:bg-primary hover:text-primary-foreground! active:bg-primary active:text-primary-foreground! focus-visible:bg-primary focus-visible:text-primary-foreground! transition-standard [&_.link-text]:hover:text-primary-foreground! [&_.link-text]:active:text-primary-foreground! [&_.link-text]:focus-visible:text-primary-foreground! [&_span]:hover:text-primary-foreground! [&_span]:active:text-primary-foreground! [&_span]:focus-visible:text-primary-foreground!",
				"menu-item":
					"whitespace-normal! flex items-center justify-between w-full px-4 py-3 text-base text-foreground hover:bg-primary hover:text-primary-foreground! active:bg-primary active:text-primary-foreground! focus-visible:bg-primary focus-visible:text-primary-foreground! transition-standard [&_.link-text]:hover:text-primary-foreground! [&_.link-text]:active:text-primary-foreground! [&_.link-text]:focus-visible:text-primary-foreground! [&_span]:hover:text-primary-foreground! [&_span]:active:text-primary-foreground! [&_span]:focus-visible:text-primary-foreground!",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

export interface LinkProps
	extends React.AnchorHTMLAttributes<HTMLAnchorElement>,
		VariantProps<typeof linkVariants> {
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
			variant,
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
			linkVariants({ variant }),
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

export { Link, linkVariants };
