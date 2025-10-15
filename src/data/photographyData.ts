import type { GalleryItem } from "~/components/ui/studio/gallery/galleryTypes";

export const photos: GalleryItem[] = [
	{
		id: "staff-photography",
		images: [
			"photography/blue-shirt-guy-1.webp",
			"photography/blue-shirt-guy-2.webp",
		],
		description: "Staff photography",
		logo: "logos/hpl.svg",
	},
	{
		id: "eclipse",
		images: ["photography/eclipse.webp"],
		description: "Eclipse over Hamilton, Ontario",
	},
	{
		id: "mobile-zoo-program",
		images: ["photography/girl-and-goat.webp"],
		description: `"March Break" — a Mobile Zoo Program by Hamilton Public Library, where I have worked as an intern`,
		logo: "logos/hpl.svg",
	},
	{
		id: "squirrel-with-nut",
		images: ["photography/squirrel-with-a-nut.webp"],
		//TODO: update store link
		storeLink: "squirrel-sticker",
		description: `I love squirrels more than anything else in this world`,
	},
	// {
	// 	id: "dinner-3-people",
	// 	images: ["photography/dinner-3-people.webp"],
	// },
	{
		id: "squirrel-photos",
		images: [
			"photography/squirrel-on-box.webp",
			"photography/squirrel-fence.webp",
		],
	},
	{
		id: "goose-water",
		images: ["photography/goose-water.webp"],
		description: `He kinda makes Canada worth living in`,
	},
	{
		id: "bird",
		images: ["photography/bird.webp"],
		description: `His ability to hold breath underwater for minutes amazes me`,
	},
	{
		id: "bebra",
		images: ["photography/bebra.webp"],
		description: `My friend Abalych!`,
	},
	{
		id: "rabbit-photos",
		images: ["photography/zaiika.webp", "photography/rabbit-yellow.webp"],
		description: `This baby is living in my garden rent free!`,
	},
];
