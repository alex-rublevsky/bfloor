import * as React from "react";
import { cn } from "~/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	required?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	({ className, type, label, required, id, ...props }, ref) => {
		const inputId = React.useId();
		const finalId = id || inputId;

		return (
			<div>
				{label && (
					<label htmlFor={finalId} className="block text-sm mb-1">
						{label}
						{required && " *"}
					</label>
				)}

				<input
					id={finalId}
					type={type}
					className={cn(
						"flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-secondary-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
						className,
					)}
					ref={ref}
					{...props}
				/>
			</div>
		);
	},
);

Input.displayName = "Input";

export { Input };
