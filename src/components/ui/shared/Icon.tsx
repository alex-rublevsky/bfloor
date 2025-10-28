interface IconProps {
	name: "plus" | "minus" | "check" | "x" | "chevron-left" | "chevron-right";
	className?: string;
	size?: number;
}

const iconPaths: Record<IconProps["name"], string> = {
	plus: "M12 4.5v15m7.5-7.5h-15",
	minus: "M4.5 12h15",
	check: "M4.5 12.75l6 6 9-13.5",
	x: "M18 6L6 18M6 6l12 12",
	"chevron-left": "M15.75 19.5L8.25 12l7.5-7.5",
	"chevron-right": "M8.25 4.5l7.5 7.5-7.5 7.5",
};

export function Icon({ name, className = "", size = 24 }: IconProps) {
	return (
		<svg
			className={className}
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={2}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<title>{name}</title>
			<path d={iconPaths[name]} />
		</svg>
	);
}

