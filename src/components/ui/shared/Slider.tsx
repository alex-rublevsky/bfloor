import * as SliderPrimitive from "@radix-ui/react-slider";
import * as React from "react";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "~/components/ui/shared/Tooltip";
import { cn } from "~/utils/utils";

interface SliderProps
	extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
	showTooltip?: boolean;
	tooltipContent?: (value: number) => React.ReactNode;
	label?: string;
	valueDisplay?: React.ReactNode;
	className?: string;
}

const Slider = React.forwardRef<
	React.ElementRef<typeof SliderPrimitive.Root>,
	SliderProps
>(
	(
		{
			className,
			showTooltip = false,
			tooltipContent,
			label,
			valueDisplay,
			...props
		},
		ref,
	) => {
		const [showTooltipState, setShowTooltipState] = React.useState(false);
		const [isDragging, setIsDragging] = React.useState(false);
		
		// Use controlled value if provided, otherwise use internal state
		const currentValue = props.value !== undefined ? props.value as number[] : 
			(props.defaultValue as number[]) ?? [0];

		const handleValueChange = (newValue: number[]) => {
			props.onValueChange?.(newValue);
		};

		const handlePointerDown = () => {
			setIsDragging(true);
			if (showTooltip) {
				setShowTooltipState(true);
			}
		};

		const handlePointerUp = React.useCallback(() => {
			setIsDragging(false);
			if (showTooltip) {
				setShowTooltipState(false);
			}
		}, [showTooltip]);

		React.useEffect(() => {
			if (showTooltip) {
				document.addEventListener("pointerup", handlePointerUp);
				return () => {
					document.removeEventListener("pointerup", handlePointerUp);
				};
			}
		}, [showTooltip, handlePointerUp]);

		const renderThumb = (value: number) => {
			const thumb = (
				<SliderPrimitive.Thumb
					className="block h-5 w-5 rounded-full border-2 border-primary bg-background transition-colors focus-visible:outline-[3px] focus-visible:outline-ring/40 data-disabled:cursor-not-allowed cursor-grab"
					onPointerDown={handlePointerDown}
				/>
			);

			if (!showTooltip) return thumb;

			return (
				<TooltipProvider>
					<Tooltip open={showTooltipState && isDragging}>
						<TooltipTrigger asChild>{thumb}</TooltipTrigger>
						<TooltipContent
							className="px-2 py-1 text-xs"
							sideOffset={8}
							side={props.orientation === "vertical" ? "right" : "top"}
						>
							<p>{tooltipContent ? tooltipContent(value) : value}</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			);
		};

		return (
			<div
				className={cn(
					"space-y-4 min-w-[13rem] w-full sm:max-w-[20rem]",
					className,
				)}
			>
				{(label || valueDisplay) && (
					<div className="flex items-center justify-between gap-2">
						{label && <p className="text-sm font-medium">{label}</p>}
						{valueDisplay}
					</div>
				)}
				<SliderPrimitive.Root
					ref={ref}
					className={cn(
						"relative flex pt-1.5 w-full touch-none select-none items-center data-[orientation=vertical]:h-full data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col data-disabled:opacity-50",
					)}
					value={currentValue}
					onValueChange={handleValueChange}
					{...props}
				>
					<SliderPrimitive.Track className="relative grow overflow-hidden rounded-full bg-secondary data-[orientation=horizontal]:h-0.5 data-[orientation=vertical]:h-full data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-2">
						<SliderPrimitive.Range className="absolute bg-primary data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full" />
					</SliderPrimitive.Track>
					{currentValue?.map((value) => (
						<React.Fragment key={`thumb-${value}`}>{renderThumb(value)}</React.Fragment>
					))}
				</SliderPrimitive.Root>
			</div>
		);
	},
);
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
