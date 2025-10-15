export type BrandingProject = {
	id: string;
	name: string;
	type: "image" | "video";
	images?: string[];
	preview?: string;
	src?: string;
	description?: string;
	logo?: string;
};
