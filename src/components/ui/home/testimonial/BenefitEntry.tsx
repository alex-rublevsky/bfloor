import type React from "react";

export default function BenefitEntry({
	title,
	description,
	icon,
}: {
	title: string;
	description: string;
	icon: React.ReactNode;
}) {
	return (
		<div className="flex flex-col items-center text-center gap-2 md:gap-4 py-3 md:py-6 w-fit min-w-0 lg:w-full lg:flex-1">
			<div className="h-16 md:h-20 xl:h-24 w-fit flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full">
				{icon}
			</div>
			<div className="flex flex-col gap-1 md:gap-2 w-fit min-w-0 max-w-[16ch] md:max-w-[20ch] lg:max-w-[28ch] xl:max-w-[30ch]">
				<h5 className="font-medium text-sm md:text-base">{title}</h5>
				<p className="text-xs md:text-sm text-muted-foreground">
					{description}
				</p>
			</div>
		</div>
	);
}
