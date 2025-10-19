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
						"flex h-10 w-full min-w-[15ch] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
						className,
					)}
					{...props}
				/>
			</div>
		);
	},
);

SearchInput.displayName = "SearchInput";
