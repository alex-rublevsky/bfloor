import { forwardRef, useRef, useState } from "react";
import { cn } from "~/lib/utils";
import { SearchSuggestions } from "../search/SearchSuggestions";
import { Button } from "./Button";
import { Search, X } from "./Icon";

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
	showSuggestions?: boolean; // New prop to enable/disable suggestions
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
			showSuggestions = false,
			...props
		},
		ref,
	) => {
		const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
		const inputWrapperRef = useRef<HTMLDivElement>(null);

		const handleClear = () => {
			onChange("");
			onClear?.();
		};

		const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
			// Handle Enter key
			if (e.key === "Enter" && onSubmit) {
				// If suggestions are open and there's a selection, let SearchSuggestions handle it
				// Otherwise, submit the current value
				if (!isSuggestionsOpen || !showSuggestions) {
					e.preventDefault();
					onSubmit(value);
				}
			}
			// Call original onKeyDown if provided
			props.onKeyDown?.(e);
		};

		const handleSuggestionSelect = (suggestion: string) => {
			onChange(suggestion);
			setIsSuggestionsOpen(false);
			onSubmit?.(suggestion);
		};

		const handleClearSearch = () => {
			onChange("");
			setIsSuggestionsOpen(false);
		};

		const handleFocus = () => {
			if (showSuggestions) {
				setIsSuggestionsOpen(true);
			}
		};

		const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			onChange(e.target.value);
			// Keep suggestions open when typing (if enabled)
			if (showSuggestions) {
				setIsSuggestionsOpen(true);
			}
		};

		const handleSearchClick = () => {
			if (onSubmit && value.trim()) {
				onSubmit(value);
			}
		};

		return (
			<div className="flex items-center gap-1 w-full">
				{value && (
					<Button
						size="icon"
						variant="secondary"
						type="button"
						onClick={handleClear}
						className="h-9 w-9 shrink-0 group"
						aria-label="Очистить поиск"
					>
						<X className="h-4 w-4 text-primary group-hover:text-primary-foreground transition-standard" />
					</Button>
				)}
				<div ref={inputWrapperRef} className="relative w-full">
					<input
						ref={ref}
						type="text"
						value={value}
						onChange={handleChange}
						onKeyDown={handleKeyDown}
						onFocus={handleFocus}
						placeholder={placeholder}
						className={cn(
							"flex h-9 w-full min-w-[15ch] rounded-md border-[1.5px] border-input bg-background px-3 pr-10 py-1 text-base shadow-xs transition-standard file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-accent hover:border-accent disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
							className,
						)}
						{...props}
					/>
					<Button
						type="button"
						onClick={handleSearchClick}
						className="absolute right-1 top-1/2 -translate-y-1/2 h-auto w-auto p-1.5 rounded-sm group border-0"
						aria-label="Поиск"
						variant="secondary"
					>
						<Search size={18} className="text-accent group-hover:text-primary-foreground transition-standard" />
					</Button>

					{/* Search suggestions dropdown */}
					{showSuggestions && (
						<SearchSuggestions
							query={value}
							onSelect={handleSuggestionSelect}
							onClose={() => setIsSuggestionsOpen(false)}
							isOpen={isSuggestionsOpen}
							inputRef={inputWrapperRef}
							onClearSearch={handleClearSearch}
						/>
					)}
				</div>
			</div>
		);
	},
);

SearchInput.displayName = "SearchInput";
