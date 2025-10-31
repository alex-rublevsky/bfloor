interface IconProps {
	name: "plus" | "minus" | "check" | "x" | "chevron-left" | "chevron-right" | "image";
	className?: string;
	size?: number;
}

const iconPaths: Record<Exclude<IconProps["name"], "image">, string> = {
	plus: "M12 4.5v15m7.5-7.5h-15",
	minus: "M4.5 12h15",
	check: "M4.5 12.75l6 6 9-13.5",
	x: "M18 6L6 18M6 6l12 12",
	"chevron-left": "M15.75 19.5L8.25 12l7.5-7.5",
	"chevron-right": "M8.25 4.5l7.5 7.5-7.5 7.5",
};


export function Icon({ name, className = "", size = 24 }: IconProps) {
	const classes = `text-muted-foreground ${className}`.trim();

	if (name === "image") {
		return (
			<svg
				className={classes}
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
				<title>image</title>
				<rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
				<circle cx="9" cy="9" r="2" />
				<path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
			</svg>
		);
	}

	return (
		<svg
			className={classes}
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

// The raw SVG pasted previously has been integrated into the Icon component as name="image".