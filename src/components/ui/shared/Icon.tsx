interface IconProps {
	name: "plus" | "minus" | "check" | "x" | "chevron-left" | "chevron-right" | "image" | "2gis" | "google" | "yandex";
	className?: string;
	size?: number;
}

const iconPaths: Record<Exclude<IconProps["name"], "image" | "2gis" | "google" | "yandex">, string> = {
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

	if (name === "2gis") {
		return (
			<svg
				className={className}
				width={size}
				height={size}
				viewBox="0 0 48 50"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden="true"
			>
				<title>2GIS</title>
				<path d="M35.6389 29.7526C26.9734 29.7969 25.5716 35.2345 25.1045 39.8322L24.8921 41.8657H23.1504L22.938 39.8322C22.4709 35.2345 21.0266 29.7968 12.6584 29.7526C11.2566 26.7463 10.6619 24.3148 10.6619 21.5739C10.6619 14.7217 16.0567 8.31123 24.0424 8.31123C32.0282 8.31123 37.338 14.6772 37.338 21.6183C37.338 24.3148 37.0832 26.7463 35.6389 29.7526ZM23.9576 0C10.7895 0 0 11.2291 0 24.9778C0 38.7711 10.7895 50 23.9576 50C37.253 50 48 38.7711 48 24.9778C48 11.2291 37.253 0 23.9576 0Z" fill="#29B24A"/>
			</svg>
		);
	}

	if (name === "google") {
		return (
			<svg
				className={className}
				width={size}
				height={size}
				viewBox="0 0 35 50"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden="true"
			>
				<title>Google</title>
				<path d="M22.7921 0.809157C21.1287 0.286166 19.3465 0 17.5049 0C12.1287 0 7.31683 2.4176 4.09901 6.22656L12.3663 13.1537L22.7921 0.809157Z" fill="#1A73E8"/>
				<path d="M4.09901 6.22656C1.44846 9.36414 -0.00345969 13.3348 6.19072e-06 17.4364C6.19072e-06 20.7125 0.653471 23.3767 1.73268 25.7549L12.3663 13.1537L4.09901 6.22656Z" fill="#EA4335"/>
				<path d="M17.505 10.7756C18.7813 10.7768 20.0306 11.1414 21.106 11.8265C22.1813 12.5117 23.0378 13.4888 23.5746 14.6428C24.1115 15.7968 24.3062 17.0797 24.136 18.3403C23.9658 19.601 23.4377 20.7869 22.6139 21.7584L33.0297 9.41385C30.8918 5.3086 27.2059 2.21721 22.7822 0.819025L12.3763 13.1636C13.0033 12.4152 13.7877 11.8134 14.674 11.4008C15.5602 10.9881 16.5267 10.7747 17.505 10.7756Z" fill="#4285F4"/>
				<path d="M17.505 24.1168C13.8119 24.1168 10.8119 21.1269 10.8119 17.4462C10.8076 15.879 11.362 14.3612 12.3763 13.1636L1.73271 25.7648C3.5545 29.7809 6.5743 33.0077 9.68321 37.0732L22.6139 21.7584C21.9857 22.4982 21.2031 23.0925 20.3207 23.4998C19.4383 23.9071 18.4774 24.1177 17.505 24.1168Z" fill="#FBBC04"/>
				<path d="M22.3564 41.2473C28.198 32.1492 35 28.0146 35 17.4364C35 14.5352 34.2871 11.8019 33.0297 9.39412L9.69308 37.0732C10.6832 38.3659 11.6832 39.7375 12.6535 41.2572C16.198 46.7239 15.2178 50 17.505 50C19.7921 50 18.8119 46.714 22.3564 41.2473Z" fill="#34A853"/>
			</svg>
		);
	}

	if (name === "yandex") {
		return (
			<svg
				className={className}
				width={size}
				height={size}
				viewBox="0 0 40 50"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden="true"
			>
				<title>Yandex</title>
				<path d="M19.898 0C8.90832 0 0 8.954 0 20C0 25.521 2.22559 30.52 5.82513 34.139C9.42566 37.76 17.9082 43 18.4056 48.5C18.4802 49.3247 19.0742 50 19.898 50C20.7217 50 21.3157 49.3247 21.3903 48.5C21.8878 43 30.3703 37.76 33.9708 34.139C37.5703 30.52 39.7959 25.521 39.7959 20C39.7959 8.954 30.8876 0 19.898 0Z" fill="#FF4433"/>
				<path d="M19.8981 27.0006C23.7443 27.0006 26.8623 23.8665 26.8623 20.0006C26.8623 16.1346 23.7443 13.0006 19.8981 13.0006C16.0518 13.0006 12.9338 16.1346 12.9338 20.0006C12.9338 23.8665 16.0518 27.0006 19.8981 27.0006Z" fill="#F7F3F3"/>
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
