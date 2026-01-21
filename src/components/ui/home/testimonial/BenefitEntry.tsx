import type React from "react";

export default function BenefitEntry({
	title,
	description,
	icon,
	className = "",
}: {
	title: string;
	description: string;
	icon: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			className={`flex flex-col items-center text-center gap-2 md:gap-4 pt-3 md:pt-6 pb-1 md:pb-2 w-fit min-w-[140px] sm:min-w-[160px] md:min-w-[180px] lg:w-full lg:flex-1 ${className}`}
		>
			<div className="h-16 md:h-20 xl:h-24 w-fit flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full">
				{icon}
			</div>
			<div className="flex flex-col gap-1 md:gap-2 w-fit min-w-0 max-w-[16ch] md:max-w-[20ch] lg:max-w-[28ch] xl:max-w-[30ch]">
				<h6 className="text-sm! sm:text-base! lg:text-lg! leading-tight!">
					{title}
				</h6>
				<p className="text-xs md:text-sm text-muted-foreground leading-tight!">
					{description}
				</p>
			</div>
		</div>
	);
}
