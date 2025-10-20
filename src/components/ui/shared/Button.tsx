import { Slot } from "@radix-ui/react-slot";
import { Link } from "@tanstack/react-router";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "~/utils/utils";

// Type definitions for TanStack Router props
type RouterParams = Record<string, string | number | boolean>;
type RouterSearch = Record<
	string,
	string | number | boolean | string[] | undefined
>;

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[15px] text-sm font-medium transition-all duration-300 ease-in-out focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-80 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
	{
		variants: {
			variant: {
				default: "bg-primary text-primary-foreground hover:bg-primary-hover",
				secondary:
					"text-primary border border-black hover:bg-[oklch(from_theme(colors.primary)_calc(l_+_0.1)_c_h)] hover:text-primary-foreground active:bg-[oklch(from_theme(colors.primary)_calc(l_+_0.1)_c_h)] active:text-primary-foreground",
				destructive:
					"bg-backgorund text-destructive border border-destructive shadow-2xs hover:bg-destructive/90 hover:text-destructive-foreground active:bg-destructive/90 active:text-destructive-foreground",
				green:
				//TODO: update with hover and active styles. create the colors using oklch in css variables.
					"bg-discount-badge text-discount-badge-foreground hover:bg-destructive/90",

				outline:
					"bg-transparent text-foreground border border-black hover:bg-primary hover:text-primary-foreground active:bg-primary active:text-primary-foreground",
				accent:
					"bg-primary text-foreground border border-black hover:bg-primary hover:text-primary-foreground active:bg-primary active:text-primary-foreground",
				link: "text-primary underline-offset-4 hover:underline active:underline",
			},
			size: {
				default: "h-11 px-4 py-3",
				sm: "h-9 rounded-[15px] px-3 py-1 text-xs",
				lg: "h-12 rounded-[15px] px-4 py-3 text-md",
				icon: "h-11 w-11",
			},
			alignment: {
				left: "text-left",
				center: "text-center",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
			alignment: "left",
		},
	},
);

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean;
	description?: string;
	centered?: boolean;
	// Link props - automatically handles internal/external routing
	to?: string;
	href?: string;
	target?: string;
	rel?: string;
	// TanStack Router specific props
	params?: RouterParams;
	search?: RouterSearch;
	hash?: string;
	preload?: "intent" | "render" | false;
	viewTransition?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{
			className,
			variant,
			size,
			asChild = false,
			description,
			centered = false,
			disabled = false,
			onMouseEnter,
			onMouseLeave,
			children,
			// Link-related props
			to,
			href,
			target,
			rel,
			params,
			search,
			hash,
			preload,
			viewTransition,
			...props
		},
		ref,
	) => {

		// Smart link detection logic
		const isLink = Boolean(to || href);
		const isExternalLink = Boolean(
			href &&
				(href.startsWith("http://") ||
					href.startsWith("https://") ||
					href.startsWith("mailto:") ||
					href.startsWith("tel:")),
		);
		const isHashLink = Boolean(href?.startsWith("#"));
		const isInternalRoute = Boolean(
			to || (href?.startsWith("/") && !isExternalLink),
		);

		// Determine the component to render
		let Comp: React.ElementType = "button";
		let linkProps: Record<string, unknown> = {};

		if (asChild) {
			Comp = Slot;
		} else if (isLink && !disabled) {
			if (isInternalRoute && to) {
				// Use TanStack Router Link for internal routes
				Comp = Link;
				linkProps = {
					to,
					params,
					search,
					hash,
					preload,
					viewTransition,
				};
			} else if (isExternalLink || isHashLink || href) {
				// Use regular anchor for external links, hash links, or any href
				Comp = "a";
				linkProps = {
					href,
					target: target || (isExternalLink ? "_blank" : undefined),
					rel: rel || (isExternalLink ? "noopener noreferrer" : undefined),
				};
			}
		}

		// When description is provided, we need to wrap content in a div structure
		const hasDescription = description && !asChild;

		const buttonContent = hasDescription ? (
			<div
				className={cn(
					"flex flex-col gap-1",
					centered && "items-center text-center",
				)}
			>
				<div className="font-light! text-2xl!">{children}</div>
				<div className="text-sm opacity-75 leading-tight font-normal whitespace-normal break-words">
					{description}
				</div>
			</div>
		) : (
			children
		);

		return (
			<Comp
				className={cn(
					buttonVariants({
						variant,
						size: hasDescription ? undefined : size,
						alignment: centered ? "center" : "left",
						className,
					}),
					// Use cursor-not-allowed for disabled buttons, cursor-default for enabled buttons
					disabled ? "cursor-not-allowed" : "cursor-pointer",
					// Adjust button styling when description is present - must come after buttonVariants to override
					hasDescription && "h-auto py-3 px-4 whitespace-normal",
				)}
				ref={ref}
				disabled={disabled}
				onMouseEnter={onMouseEnter}
				onMouseLeave={onMouseLeave}
				{...linkProps}
				{...props}
			>
				{buttonContent}
			</Comp>
		);
	},
);
Button.displayName = "Button";

export { Button, buttonVariants };
