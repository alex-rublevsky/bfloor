import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import * as React from "react";
import { useCursorHover } from "~/components/ui/shared/custom_cursor/CustomCursorContext";

import { cn } from "~/utils/utils";

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.Value>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.Value>
>(({ className, ...props }, ref) => (
	<SelectPrimitive.Value ref={ref} className={cn("", className)} {...props} />
));
SelectValue.displayName = SelectPrimitive.Value.displayName;

const SelectTrigger = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.Trigger>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
		variant?: "default" | "navbar";
	}
>(
	(
		{
			className,
			variant = "default",
			children,
			onMouseEnter,
			onMouseLeave,
			...props
		},
		ref,
	) => {
		const { handleMouseEnter, handleMouseLeave: handleMouseLeaveHook } =
			useCursorHover("small");

		return (
			<SelectPrimitive.Trigger
				ref={ref}
				className={cn(
					"relative flex rounded-full border border-border bg-background hover:border-black hover:bg-primary/5 active:border-black active:bg-primary/5 transition-all duration-200",
					"focus:outline-hidden focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
					// Responsive width - larger for default (Sort By), smaller for navbar (Other)
					"w-[18ch]",
					variant === "navbar" && "w-[10ch]",
					// Custom cursor styles - always cursor-pointer
					"cursor-pointer",
					className,
				)}
				onMouseEnter={handleMouseEnter(onMouseEnter)}
				onMouseLeave={handleMouseLeaveHook(onMouseLeave)}
				{...props}
			>
				<span className="relative z-10 flex items-center justify-between w-full cursor-pointer px-2 md:px-4 py-1.5 md:py-2 text-sm md:text-sm font-medium text-foreground">
					<span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left [filter:none] [mix-blend-normal]">
						{children}
					</span>
					<SelectPrimitive.Icon asChild>
						<ChevronDown className="h-3 w-3 md:h-4 md:w-4 ml-2 opacity-50 flex-shrink-0" />
					</SelectPrimitive.Icon>
				</span>
			</SelectPrimitive.Trigger>
		);
	},
);
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectContent = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
	<SelectPrimitive.Portal>
		<SelectPrimitive.Content
			ref={ref}
			className={cn(
				"relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-2xl border border-black bg-background text-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
				position === "popper" &&
					"data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
				className,
			)}
			position={position}
			{...props}
		>
			<SelectPrimitive.Viewport
				className={cn(
					"",
					position === "popper" &&
						"h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]",
				)}
			>
				{children}
			</SelectPrimitive.Viewport>
		</SelectPrimitive.Content>
	</SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.Label>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
	<SelectPrimitive.Label
		ref={ref}
		className={cn("px-2 py-1.5 text-sm font-semibold", className)}
		{...props}
	/>
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.Item>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, onMouseEnter, onMouseLeave, ...props }, ref) => {
	const { handleMouseEnter, handleMouseLeave: handleMouseLeaveHook } =
		useCursorHover("small");

	return (
		<SelectPrimitive.Item
			ref={ref}
			className={cn(
				"relative flex w-full cursor-default select-none items-center py-2 px-3 text-sm outline-none focus:bg-primary focus:text-primary-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-primary hover:text-primary-foreground active:bg-priamry active:text-primary-foreground transition-colors duration-200",
				// Custom cursor styles - always cursor-pointer
				"cursor-pointer",
				className,
			)}
			onMouseEnter={handleMouseEnter(onMouseEnter)}
			onMouseLeave={handleMouseLeaveHook(onMouseLeave)}
			{...props}
		>
			<span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
				<SelectPrimitive.ItemIndicator>
					<Check className="h-3 w-3" />
				</SelectPrimitive.ItemIndicator>
			</span>

			<SelectPrimitive.ItemText className="pr-6">
				{children}
			</SelectPrimitive.ItemText>
		</SelectPrimitive.Item>
	);
});
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.Separator>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
	<SelectPrimitive.Separator
		ref={ref}
		className={cn("-mx-1 my-1 h-px bg-muted", className)}
		{...props}
	/>
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
	Select,
	SelectGroup,
	SelectValue,
	SelectTrigger,
	SelectContent,
	SelectLabel,
	SelectItem,
	SelectSeparator,
};
