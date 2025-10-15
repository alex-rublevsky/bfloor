import type { ReactNode } from "react";
import { Image } from "~/components/ui/shared/Image";

function skillLogo({
	name,
	alt,
	link,
	svg,
	wideLogo = false,
}: {
	name: string;
	alt?: string;
	link?: string;
	svg?: ReactNode;
	wideLogo?: boolean;
}) {
	const altText = alt || `${name} Logo`;

	return (
		<div className="flex flex-col gap-6 group transition-all h-full">
			<div className="w-full flex items-center justify-center h-16 md:h-20">
				<div
					className={`relative flex items-center justify-center ${
						wideLogo ? "w-24 md:w-28 h-12 md:h-14" : "w-14 h-14 md:h-22"
					}`}
				>
					{svg ? (
						<div className="group-hover:opacity-70 transition-opacity md:scale-125 flex items-center justify-center w-full h-full">
							<div className="w-full h-full flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto">
								{svg}
							</div>
						</div>
					) : link ? (
						<Image
							src={link}
							alt={altText}
							width={100}
							height={100}
							className="group-hover:opacity-70 transition-opacity md:scale-125 object-contain"
						/>
					) : null}
				</div>
			</div>
			<p className="text-center text-sm md:text-base font-medium whitespace-nowrap text-muted-foreground mt-auto">
				{name}
			</p>
		</div>
	);
}

export default skillLogo;
