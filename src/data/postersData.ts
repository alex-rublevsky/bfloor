import type { GalleryItem } from "~/components/ui/studio/gallery/galleryTypes";

//TODO: add logos for cinema 4d, photoshop, indesign
export const posters: GalleryItem[] = [
	{
		id: "artlab-poster",
		images: ["posters/artlab.webp"],
		description: "ArtLab poster",
	},
	{
		id: "capybara-cave",
		images: ["posters/capybara-cave.webp"],
		description: "A photo manipulation I have created using Photoshop",
	},
	{
		id: "cyberpunk-capy",
		images: ["posters/cyberpunk-capy.webp"],
		description: "A photo manipulation I have created using Photoshop",
	},
	{
		id: "fencing",
		images: ["posters/fencing.webp"],
		description: "A poster made with InDesign and Photoshop",
	},
	{
		id: "graffiti-bark-abalych",
		images: [
			"products/stickers/abalych-graffiti-bark-second/abalych-graffiti-bark-second.webp",
			"products/stickers/abalych-graffiti-bark-second/abalych-graffiti-bark-second-preview.webp",
		],
		storeLink: "graffiti-bark-sticker-20",
	},
	{
		id: "graffiti-brak-abalych-green",
		images: ["posters/graffiti-brak-abalych-green.jpg"],
	},
	{
		id: "ice-cold",
		images: ["posters/ice-cold.webp"],
		description: "Some Cinema4D experementation",
	},
	{
		id: "madness",
		images: ["posters/madness.webp"],
		//TODO: spelling
		description: "Saturn devouvering his son. InDesign and Photoshop.",
	},
	{
		id: "pelevin",
		images: ["posters/pelevin.webp"],
		description: `He's one of my favourite authors`,
	},
	{
		id: "quite",
		images: ["posters/quite.webp"],
	},
	{
		id: "skate-contest",
		images: ["posters/skate-contest.webp"],
	},
	{
		id: "thin-and-fragile",
		images: ["posters/thin-and-fragile.webp"],
		description: `Some more Cinema4D experementation!`,
	},
	{
		id: "painting",
		images: ["posters/painting.webp"],
		description: "I barely draw, but sometimes things come out",
	},
];
