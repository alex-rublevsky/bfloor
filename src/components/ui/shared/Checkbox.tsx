import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import type * as React from "react";

import { cn } from "~/lib/utils";

function Checkbox({
	className,
	...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
	return (
		<CheckboxPrimitive.Root
			data-slot="checkbox"
			className={cn(
				"cursor-pointer size-4 shrink-0 rounded-[4px] border transition-all outline-none",
				// Default: black outline
				"border-primary	 bg-transparent",
				// Checked: fully black fill and border
				"data-[state=checked]:bg-primary data-[state=checked]:border-primary",
				// Accessibility focus
				"focus-visible:ring-[2px] focus-visible:ring-ring/40 focus-visible:border-black",
				// Disabled
				"disabled:cursor-not-allowed disabled:opacity-50",
				className,
			)}
			{...props}
		>
			{/* Hide indicator to keep a simple solid fill when checked */}
			<CheckboxPrimitive.Indicator
				data-slot="checkbox-indicator"
				className="hidden"
			/>
		</CheckboxPrimitive.Root>
	);
}

export { Checkbox };
