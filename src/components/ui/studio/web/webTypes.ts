export type Tool = {
	name: string;
	icon?: string;
	largeIcon?: boolean;
};

export type Device = {
	type: "phone" | "tablet" | "desktop";
	content: {
		type: "video" | "image";
		url: string;
	};
};

export type ProjectLayout =
	| "full" // Both phone and tablet
	| "tablet-only" // Just tablet
	| "stacked-images" // For projects with multiple stacked images
	| "custom"; // For any special cases

export type Project = {
	id: string;
	title: string;
	description: string;
	tools: Tool[];
	websiteUrl: string;
	layout: ProjectLayout;
	devices: Device[];
};
