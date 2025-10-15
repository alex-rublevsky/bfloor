import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "~/utils/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./Tooltip";

const badgeVariants = cva(
	"inline-flex items-center justify-center rounded-md border w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-all overflow-hidden border-transparent hover:brightness-95 active:brightness-95",
	{
		variants: {
			variant: {
				default:
					"bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/90",
				secondary:
					"bg-muted/65 text-secondary-foreground hover:brightness-96 active:brightness-96",
				destructive:
					"bg-destructive text-primary-foreground hover:bg-destructive/90 active:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/70",
				outline:
					"text-foreground border-muted hover:bg-muted hover:text-foreground active:bg-muted active:text-foreground",
				green:
					"bg-discount-badge text-discount-badge-foreground font-medium hover:bg-discount-badge/90 active:bg-discount-badge/90 focus-visible:ring-discount-badge/20 dark:focus-visible:ring-discount-badge/40 dark:bg-discount-badge/70",
				
				greenOutline:
					"!bg-transparent border-discount-badge text-discount-badge-foreground font-medium hover:!bg-discount-badge hover:text-discount-badge-foreground active:!bg-discount-badge active:text-discount-badge-foreground hover:brightness-100 active:brightness-100 focus-visible:ring-discount-badge/20 dark:focus-visible:ring-discount-badge/40 dark:bg-discount-badge/70 border-solid",
			},
			size: {
				default: "px-2 py-0.5 text-xs",
				lg: "px-3 py-1 text-2xl",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

// Tea category interface for enhanced badge functionality
interface TeaCategory {
	slug: string;
	name: string;
	description?: string | null;
	blogSlug?: string | null;
	isActive: boolean;
}

function Badge({
	className,
	variant,
	size,
	asChild = false,
	teaCategory,
	...props
}: React.ComponentProps<"span"> &
	VariantProps<typeof badgeVariants> & { 
		asChild?: boolean;
		teaCategory?: TeaCategory;
	}) {
	const Comp = asChild ? Slot : "span";

	// Check if variant is a tea category slug (not a standard badge variant)
	const standardVariants = ["default", "secondary", "destructive", "outline", "green", "greenOutline"];
	const isTeaCategorySlug = typeof variant === "string" && !standardVariants.includes(variant);

	// If we have a tea category object, use its data
	const effectiveSlug = teaCategory ? teaCategory.slug : (typeof variant === "string" ? variant : "");
	const effectiveName = teaCategory ? teaCategory.name : props.children;
	const effectiveDescription = teaCategory ? teaCategory.description : undefined;
	const effectiveBlogSlug = teaCategory ? teaCategory.blogSlug : undefined;

	// Determine if this is a tea category (either by variant or teaCategory prop)
	const isTeaCategory = teaCategory || isTeaCategorySlug;

	// Render tea category badge with enhanced functionality
	if (isTeaCategory && teaCategory) {
		// Case 1: Has blog slug - render as clickable link (with optional tooltip if description exists)
		if (effectiveBlogSlug) {
			const blogUrl = `https://rublevsky.studio/blog/${effectiveBlogSlug}`;
			
			// If both blogSlug and description exist, wrap with tooltip
			if (effectiveDescription) {
				return (
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<Slot
									data-slot="badge"
									className={cn(
										badgeVariants({ variant: undefined, size }),
										effectiveSlug,
										className
									)}
								>
									<a
										href={blogUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="cursor-pointer underline underline-offset-[0.1rem] decoration-[0.09rem] decoration-primary hover:brightness-90 active:brightness-90 transition-all"
									>
										{effectiveName}
									</a>
								</Slot>
							</TooltipTrigger>
							<TooltipContent>
								<p className="max-w-xs">{effectiveDescription}</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				);
			}
			
			// If only blogSlug exists (no description), render as simple link
			return (
				<Slot
					data-slot="badge"
					className={cn(
						badgeVariants({ variant: undefined, size }),
						effectiveSlug,
						className
					)}
				>
					<a
						href={blogUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="cursor-pointer underline underline-offset-[0.1rem] decoration-[0.09rem] decoration-primary hover:brightness-90 active:brightness-90 transition-all"
					>
						{effectiveName}
					</a>
				</Slot>
			);
		}

		// Case 2: Has description but no blog slug - render with tooltip
		if (effectiveDescription) {
			return (
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<span
								data-slot="badge"
								className={cn(
									badgeVariants({ variant: undefined, size }),
									effectiveSlug,
									"cursor-help",
									className
								)}
							>
								{effectiveName}
							</span>
						</TooltipTrigger>
						<TooltipContent>
							<p className="max-w-xs">{effectiveDescription}</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			);
		}

		// Case 3: No blog slug, no description - render as regular badge
		return (
			<span
				data-slot="badge"
				className={cn(
					badgeVariants({ variant: undefined, size }),
					effectiveSlug,
					className
				)}
			>
				{effectiveName}
			</span>
		);
	}

	// Regular badge rendering for non-tea categories
	return (
		<Comp
			data-slot="badge"
			className={cn(
				// Apply base badge styles and size
				badgeVariants({ variant: isTeaCategorySlug ? undefined : variant, size }),
				// Use tea category slug directly as CSS class
				isTeaCategorySlug ? variant : "",
				className
			)}
			{...props}
		/>
	);
}

export { Badge, badgeVariants };
