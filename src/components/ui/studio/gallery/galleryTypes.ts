export type GalleryItem = {
	id: string;
	images: string[];
	description?: string;
	logo?: string;
	storeLink?: string;
};

export type GalleryType = "photos" | "posters";
