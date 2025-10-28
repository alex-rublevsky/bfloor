import { X } from "lucide-react";
import { forwardRef } from "react";
import { cn } from "~/lib/utils";
import { Button } from "./Button";

interface SearchInputProps
	extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
	value: string;
	onChange: (value: string) => void;
	onClear?: () => void;
	placeholder?: string;
	className?: string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
	(
		{
			value,
			onChange,
			onClear,
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

		return (
			<div className="flex items-center gap-2 w-full">
				{value && (
					<Button
						size="icon"
						variant="secondary"
						type="button"
						onClick={handleClear}
						className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
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
					placeholder={placeholder}
					className={cn(
						"flex h-9 w-full min-w-[15ch] rounded-md border border-input bg-background px-3 py-1 text-base shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary hover:border-primary disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
						className,
					)}
					{...props}
				/>
			</div>
		);
	},
);

SearchInput.displayName = "SearchInput";
