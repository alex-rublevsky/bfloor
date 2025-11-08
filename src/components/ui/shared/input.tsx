import * as React from "react";
import { cn } from "~/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	required?: boolean;
	error?: string;
	labelBackgroundColor?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	(
		{
			className,
			type,
			label,
			required,
			id,
			error,
			value,
			defaultValue,
			labelBackgroundColor,
			...props
		},
		ref,
	) => {
		const inputId = React.useId();
		const finalId = id || inputId;
		const [isFocused, setIsFocused] = React.useState(false);
		const [hasValue, setHasValue] = React.useState(
			Boolean(value || defaultValue),
		);
		const inputRef = React.useRef<HTMLInputElement>(null);
		const combinedRef = React.useCallback(
			(node: HTMLInputElement | null) => {
				if (typeof ref === "function") {
					ref(node);
				} else if (ref) {
					ref.current = node;
				}
				inputRef.current = node;
			},
			[ref],
		);

		React.useEffect(() => {
			setHasValue(Boolean(value || defaultValue));
		}, [value, defaultValue]);

		const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
			setIsFocused(true);
			props.onFocus?.(e);
		};

		const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
			setIsFocused(false);
			setHasValue(Boolean(e.target.value));
			props.onBlur?.(e);
		};

		const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			setHasValue(Boolean(e.target.value));
			props.onChange?.(e);
		};

		const isLabelFloating = isFocused || hasValue;

		return (
			<div className="relative h-9">
				{label && (
					<label
						htmlFor={finalId}
						className={cn(
							"absolute left-3 text-sm text-muted-foreground pointer-events-none transition-faster origin-left z-10",
							isLabelFloating && [
								"top-0 -translate-y-1/2 scale-75 px-1 text-foreground",
								labelBackgroundColor || "bg-background",
							],
							!isLabelFloating && "top-1/2 -translate-y-1/2",
						)}
					>
						<span className="flex items-center gap-1">
							{label}
							{required && <span className="text-destructive">*</span>}
						</span>
					</label>
				)}

				<input
					id={finalId}
					type={type}
					value={value}
					defaultValue={defaultValue}
					className={cn(
						"flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground shadow-sm shadow-black/5 transition-faster placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50",
						type === "search" &&
							"[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none",
						type === "file" &&
							"p-0 pr-3 italic text-muted-foreground/70 file:me-3 file:h-full file:border-0 file:border-r file:border-solid file:border-input file:bg-transparent file:px-3 file:text-sm file:font-medium file:not-italic file:text-foreground",
						label && isLabelFloating && "pt-4",
						error &&
							"border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20",
						className,
					)}
					ref={combinedRef}
					onFocus={handleFocus}
					onBlur={handleBlur}
					onChange={handleChange}
					{...props}
				/>

				{error && (
					<span className="absolute -bottom-5 left-0 text-red-500 text-xs font-medium">
						{error}
					</span>
				)}
			</div>
		);
	},
);

Input.displayName = "Input";

export { Input };
