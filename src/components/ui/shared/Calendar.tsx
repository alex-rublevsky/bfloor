import { ChevronLeft, ChevronRight } from "lucide-react";
import type * as React from "react";
import { DayPicker } from "react-day-picker";
import { buttonVariants } from "~/components/ui/shared/Button";
import { cn } from "~/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

// Chevron component for navigation arrows
interface ChevronProps {
	orientation?: "left" | "right" | "up" | "down";
	className?: string;
	size?: number;
	disabled?: boolean;
	[key: string]: unknown;
}

const Chevron = (props: ChevronProps) => {
	if (props.orientation === "left") {
		return (
			<ChevronLeft size={16} strokeWidth={2} {...props} aria-hidden="true" />
		);
	}
	return (
		<ChevronRight size={16} strokeWidth={2} {...props} aria-hidden="true" />
	);
};

// Button component override for calendar
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	className?: string;
	children?: React.ReactNode;
}

const CalendarButton = ({ className, children, ...props }: ButtonProps) => (
	<button
		className={cn("cursor-pointer pointer-events-auto", className)}
		type="button"
		{...props}
	>
		{children}
	</button>
);

function Calendar({
	className,
	classNames,
	showOutsideDays = true,
	components: userComponents,
	...props
}: CalendarProps) {
	const defaultClassNames = {
		months: "relative flex flex-col sm:flex-row gap-4",
		month: "w-full",
		month_caption:
			"relative mx-10 mb-1 flex h-9 items-center justify-center z-20",
		caption_label: "text-sm font-medium",
		nav: "absolute top-0 flex w-full justify-between z-10",
		button_previous: cn(
			buttonVariants({ variant: "ghost" }),
			"size-9 text-muted-foreground/80 hover:text-foreground active:text-foreground p-0 cursor-pointer",
		),
		button_next: cn(
			buttonVariants({ variant: "ghost" }),
			"size-9 text-muted-foreground/80 hover:text-foreground active:text-foreground p-0 cursor-pointer",
		),
		weekday: "size-9 p-0 text-xs font-medium text-muted-foreground/80",
		day_button:
			"relative flex size-9 items-center justify-center whitespace-nowrap rounded-lg p-0 text-foreground outline-offset-2 cursor-pointer pointer-events-auto transition-all duration-150 focus:outline-none group-data-[disabled]:pointer-events-none group-data-[disabled]:cursor-not-allowed focus-visible:z-10 hover:bg-accent active:bg-accent group-data-[selected]:bg-primary group-data-[selected]:text-primary-foreground group-data-[selected]:hover:bg-transparent group-data-[selected]:hover:text-foreground group-data-[selected]:hover:border-2 group-data-[selected]:hover:border-black group-data-[selected]:active:bg-transparent group-data-[selected]:active:text-foreground group-data-[selected]:active:border-2 group-data-[selected]:active:border-black hover:text-foreground active:text-foreground group-data-[disabled]:text-foreground/30 group-data-[disabled]:line-through group-data-[outside]:text-foreground/30 group-data-[outside]:group-data-[selected]:text-primary-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 group-[.range-start:not(.range-end)]:rounded-e-none group-[.range-end:not(.range-start)]:rounded-s-none group-[.range-middle]:rounded-none group-data-[selected]:group-[.range-middle]:bg-accent group-data-[selected]:group-[.range-middle]:text-foreground",
		day: "group size-9 px-0 text-sm",
		range_start: "range-start",
		range_end: "range-end",
		range_middle: "range-middle",
		today:
			"*:after:pointer-events-none *:after:absolute *:after:bottom-1 *:after:start-1/2 *:after:z-10 *:after:size-[3px] *:after:-translate-x-1/2 *:after:rounded-full *:after:bg-primary [&[data-selected]:not(.range-middle)>*]:after:bg-background [&[data-disabled]>*]:after:bg-foreground/30 *:after:transition-colors",
		outside:
			"text-muted-foreground data-selected:bg-accent/50 data-selected:text-muted-foreground",
		hidden: "invisible",
		week_number: "size-9 p-0 text-xs font-medium text-muted-foreground/80",
	};

	const mergedClassNames: typeof defaultClassNames = Object.keys(
		defaultClassNames,
	).reduce(
		(acc, key) => {
			const defaultKey = key as keyof typeof defaultClassNames;
			const classNamesKey = key as keyof typeof classNames;

			acc[defaultKey] = classNames?.[classNamesKey]
				? cn(defaultClassNames[defaultKey], classNames[classNamesKey])
				: defaultClassNames[defaultKey];

			return acc;
		},
		{} as typeof defaultClassNames,
	);

	const defaultComponents = {
		Chevron,
		Button: CalendarButton,
	};

	const mergedComponents = {
		...defaultComponents,
		...userComponents,
	};

	return (
		<DayPicker
			showOutsideDays={showOutsideDays}
			className={cn(
				"w-fit p-3 bg-background rounded-lg border border-border pointer-events-auto",
				className,
			)}
			classNames={mergedClassNames}
			components={mergedComponents}
			{...props}
		/>
	);
}
Calendar.displayName = "Calendar";

export { Calendar };
