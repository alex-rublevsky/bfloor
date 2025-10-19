import { cva } from "class-variance-authority";
import useSound from "use-sound";
import { cn } from "~/utils/utils";

interface FilterOption {
	slug: string;
	name: string;
}
interface FilterButtonProps {
	onClick: () => void;
	isSelected: boolean;
	isDisabled?: boolean;
	children: React.ReactNode;
	className?: string;
	variant?: "default" | "product";
	title?: string;
}

const buttonVariants = cva("transition-all duration-200 border", {
	variants: {
		variant: {
			default:
				"px-2 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium rounded-full",
			product: "px-2 py-1 text-xs rounded-full",
		},
		state: {
			selected: "border-black bg-primary text-primary-foreground",
			unselected:
				"border-border bg-background/80 hover:border-black hover:bg-primary/5 active:border-black active:bg-primary/5 active:scale-95",
			disabled:
				"border-border bg-muted hover:border-black active:border-black text-muted-foreground",
			"selected-disabled":
				"border-muted-foreground bg-muted/50 text-muted-foreground",
		},
	},
	defaultVariants: {
		variant: "default",
		state: "unselected",
	},
});

function FilterButton({
	onClick,
	isSelected,
	isDisabled = false,
	children,
	className,
	variant = "default",
	title,
}: FilterButtonProps) {
	const [playHoverSound] = useSound("/assets/plunger-immediate.mp3", {
		volume: 0.25,
	});

	const state = isDisabled
		? isSelected
			? "selected-disabled"
			: "disabled"
		: isSelected
		? "selected"
		: "unselected";

	return (
		<button
			type="button"
			onClick={(e) => {
				e.stopPropagation();
				e.preventDefault();
				onClick();
			}}
			className={cn(
				// Use cursor-not-allowed for disabled buttons, cursor-pointer for enabled buttons
				"cursor-pointer",
				buttonVariants({ variant, state }),
				className,
			)}
			title={title}
			onMouseEnter={() => {
				if (!isDisabled) {
					playHoverSound();
				}
			}}
			onMouseLeave={() => {}}
		>
			{children}
		</button>
	);
}

interface FilterGroupProps {
	title?: string;
	options: (FilterOption | string)[];
	selectedOptions: string | null;
	onOptionChange: (option: string | null) => void;
	className?: string;
	showAllOption?: boolean;
	allOptionLabel?: string;
	variant?: "default" | "product";
	getOptionAvailability?: (option: string) => boolean;
	titleClassName?: string;
}

export function FilterGroup({
	title,
	options,
	selectedOptions,
	onOptionChange,
	className,
	showAllOption = true,
	allOptionLabel = "All",
	variant = "default",
	getOptionAvailability,
	titleClassName,
}: FilterGroupProps) {
	const handleOptionClick = (optionSlug: string) => {
		onOptionChange(optionSlug === selectedOptions ? null : optionSlug);
	};

	const isSelected = (optionSlug: string) => {
		return selectedOptions === optionSlug;
	};

	const getOptionName = (option: FilterOption | string) => {
		return typeof option === "string" ? option : option.name;
	};

	const getOptionSlug = (option: FilterOption | string) => {
		return typeof option === "string" ? option : option.slug;
	};

	return (
		<div className="space-y-2">
			{title && (
				<div
					className={cn(
						variant === "product"
							? "text-xs font-medium text-muted-foreground mb-1"
							: "text-sm font-medium",
						titleClassName,
					)}
				>
					{title}
				</div>
			)}
			<div className={cn("flex flex-wrap gap-1", className)}>
				{showAllOption && (
					<FilterButton
						onClick={() => onOptionChange(null)}
						isSelected={selectedOptions === null}
						variant={variant}
					>
						{allOptionLabel}
					</FilterButton>
				)}
				{options.map((option) => {
					const optionSlug = getOptionSlug(option);
					const isAvailable = getOptionAvailability
						? getOptionAvailability(optionSlug)
						: true;

					return (
						<FilterButton
							key={optionSlug}
							onClick={() => handleOptionClick(optionSlug)}
							isSelected={isSelected(optionSlug)}
							isDisabled={!isAvailable}
							variant={variant}
							title={!isAvailable ? "This option is not available" : undefined}
						>
							{getOptionName(option)}
						</FilterButton>
					);
				})}
			</div>
		</div>
	);
}
