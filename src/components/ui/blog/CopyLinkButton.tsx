import { cva, type VariantProps } from "class-variance-authority";
import { Check, Link } from "lucide-react";
import type * as React from "react";
import { useState } from "react";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "~/components/ui/shared/Tooltip";
import { cn } from "~/utils/utils";

const buttonVariants = cva(
	"inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
	{
		variants: {
			variant: {
				default:
					"bg-primary text-primary-foreground shadow-xs shadow-black/5 hover:bg-primary/90 active:bg-primary/90",
				destructive:
					"bg-destructive text-destructive-foreground shadow-xs shadow-black/5 hover:bg-destructive/90 active:bg-destructive/90",
				outline:
					"border border-input bg-background shadow-xs shadow-black/5 hover:bg-accent hover:text-accent-foreground active:bg-accent active:text-accent-foreground",
				secondary:
					"bg-secondary text-secondary-foreground shadow-xs shadow-black/5 hover:bg-secondary/80 active:bg-secondary/80",
				ghost:
					"hover:bg-accent hover:text-accent-foreground active:bg-accent active:text-accent-foreground",
				link: "text-primary underline-offset-4 hover:underline active:underline",
			},
			size: {
				default: "h-9 px-4 py-2",
				sm: "h-8 rounded-lg px-3 text-xs",
				lg: "h-10 rounded-lg px-8",
				icon: "h-9 w-9",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {}

interface CopyLinkButtonProps {
	sectionId?: string;
}

export function CopyLinkButton({ sectionId }: CopyLinkButtonProps) {
	const [copied, setCopied] = useState<boolean>(false);

	const handleCopy = async () => {
		try {
			const url = new URL(window.location.href);
			if (sectionId) {
				url.hash = sectionId;
			}
			await navigator.clipboard.writeText(url.toString());
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch (err) {
			console.error("Failed to copy text: ", err);
		}
	};

	return (
		<TooltipProvider delayDuration={0}>
			<Tooltip>
				<TooltipTrigger asChild>
					<button
						type="button"
						className={cn(
							buttonVariants({ variant: "outline", size: "icon" }),
							"disabled:opacity-100 cursor-pointer hover:cursor-pointer",
							"transition-all duration-200 ease-in-out",
							"hover:scale-105 hover:shadow-md active:scale-95",
						)}
						onClick={handleCopy}
						aria-label={copied ? "Copied" : "Copy to clipboard"}
						disabled={copied}
					>
						<div
							className={cn(
								"transition-all",
								copied ? "scale-100 opacity-100" : "scale-0 opacity-0",
							)}
						>
							<Check
								className="stroke-emerald-500"
								size={16}
								strokeWidth={2}
								aria-hidden="true"
							/>
						</div>
						<div
							className={cn(
								"absolute transition-all",
								copied ? "scale-0 opacity-0" : "scale-100 opacity-100",
							)}
						>
							<Link size={16} strokeWidth={2} aria-hidden="true" />
						</div>
					</button>
				</TooltipTrigger>
				<TooltipContent className="px-2 py-1 text-xs transition-opacity duration-200">
					{copied ? "Copied!" : "Copy link to post"}
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}
