import * as React from "react";

import { cn } from "~/lib/utils";

interface TextareaProps
	extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
	label?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
	({ className, label, ...props }, ref) => {
		const id = React.useId();

		return (
			<div>
				{label && (
					<label htmlFor={id} className="block text-sm font-medium mb-1">
						{label}
					</label>
				)}
				<textarea
					id={id}
					className={cn(
						"flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm field-sizing-content",
						className,
					)}
					ref={ref}
					data-vaul-no-drag=""
					{...props}
				/>
			</div>
		);
	},
);
Textarea.displayName = "Textarea";

export { Textarea };
