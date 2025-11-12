import { X } from "lucide-react";
import { forwardRef } from "react";
import { cn } from "~/lib/utils";
import { Button } from "./Button";

interface SearchInputProps
	extends Omit<
		React.InputHTMLAttributes<HTMLInputElement>,
		"onChange" | "onSubmit"
	> {
	value: string;
	onChange: (value: string) => void;
	onClear?: () => void;
	onSubmit?: (value: string) => void;
	placeholder?: string;
	className?: string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
	(
		{
			value,
			onChange,
			onClear,
			onSubmit,
			placeholder = "Search...",
			className,
			...props
		},
		ref,
	) => {
		const handleClear = () => {
			onChange("");
			onClear?.();
		};

		const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.key === "Enter" && onSubmit) {
				e.preventDefault();
				onSubmit(value);
			}
			// Call original onKeyDown if provided
			props.onKeyDown?.(e);
		};

		return (
			<div className="flex items-center gap-2 w-full">
				{value && (
					<Button
						size="icon"
						variant="secondary"
						type="button"
						onClick={handleClear}
						className="h-9 w-9 text-muted-foreground hover:text-foreground transition-standard flex-shrink-0"
						aria-label="Очистить поиск"
					>
						<X className="h-4 w-4" style={{ color: "currentColor" }} />
					</Button>
				)}
				<input
					ref={ref}
					type="text"
					value={value}
					onChange={(e) => onChange(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder={placeholder}
					className={cn(
						"flex h-9 w-full min-w-[15ch] rounded-md border-[1.5px] border-input bg-background px-3 py-1 text-base shadow-xs transition-standard file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-accent hover:border-accent disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
						className,
					)}
					{...props}
				/>
			</div>
		);
	},
);

SearchInput.displayName = "SearchInput";
