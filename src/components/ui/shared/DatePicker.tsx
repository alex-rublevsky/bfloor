import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "~/components/ui/shared/Button";
import { Calendar } from "~/components/ui/shared/Calendar";
import { Label } from "~/components/ui/shared/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "~/components/ui/shared/Popover";
import { cn } from "~/lib/utils";

interface DatePickerProps {
	date?: Date;
	onDateChange?: (date: Date | undefined) => void;
	label?: string;
	placeholder?: string;
	className?: string;
	disabled?: boolean;
}

function DatePicker({
	date,
	onDateChange,
	label,
	placeholder = "Pick a date",
	className,
	disabled = false,
}: DatePickerProps) {
	const id = useId();
	const [internalDate, setInternalDate] = useState<Date | undefined>(date);

	const selectedDate = date !== undefined ? date : internalDate;

	const handleDateSelect = (newDate: Date | undefined) => {
		// Convert to UTC midnight to avoid timezone issues
		let adjustedDate = newDate;
		if (newDate) {
			adjustedDate = new Date(
				Date.UTC(
					newDate.getFullYear(),
					newDate.getMonth(),
					newDate.getDate(),
					12, // Set to noon UTC to avoid any date shifting
					0,
					0,
					0,
				),
			);
		}

		if (onDateChange) {
			onDateChange(adjustedDate);
		} else {
			setInternalDate(adjustedDate);
		}
	};

	return (
		<div className={cn("space-y-2", className)}>
			{label && <Label htmlFor={id}>{label}</Label>}
			<Popover>
				<PopoverTrigger asChild>
					<Button
						id={id}
						variant={"outline"}
						disabled={disabled}
						className={cn(
							"group w-full justify-between bg-background px-3 font-normal outline-offset-0 hover:bg-primary hover:text-primary-foreground active:bg-primary active:text-primary-foreground focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20 transition-colors duration-200",
							!selectedDate &&
								"text-muted-foreground hover:text-primary-foreground active:text-primary-foreground",
						)}
					>
						<span
							className={cn(
								"truncate",
								!selectedDate && "text-muted-foreground",
							)}
						>
							{selectedDate ? format(selectedDate, "PPP") : placeholder}
						</span>
						<CalendarIcon
							size={16}
							strokeWidth={2}
							className="shrink-0 text-muted-foreground/80 transition-colors group-hover:text-primary-foreground group-active:text-primary-foreground"
							aria-hidden="true"
						/>
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-auto p-0" align="start">
					<Calendar
						mode="single"
						selected={selectedDate}
						onSelect={handleDateSelect}
					/>
				</PopoverContent>
			</Popover>
		</div>
	);
}

export { DatePicker };
