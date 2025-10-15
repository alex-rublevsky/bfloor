import type { BrandingProject } from "~/components/ui/studio/branding/brandingTypes";

export const brandingProjects: BrandingProject[] = [
	{
		id: "yin-yang-graffiti",
		name: "Yin Yang Graffiti",
		type: "image",
		images: [
			"products/apparel/yin-yang-graffiti-blue/yin-yang-graffiti-blue-hoodie-and-shirt.webp",
			"products/apparel/yin-yang-graffiti-blue/yin-yang-graffiti-blue-hoodie-1.webp",
			"products/apparel/yin-yang-graffiti-blue/yin-yang-graffiti-blue-hoodie-2.webp",
			"products/apparel/yin-yang-graffiti-blue/yin-yang-graffiti-blue-shirt-1.webp",
			"products/apparel/yin-yang-graffiti-blue/yin-yang-graffiti-blue-shirt-2.webp",
			"products/apparel/yin-yang-graffiti-blue/yin-yang-graffiti-blue-shirt-3.webp",
			"products/apparel/yin-yang-graffiti-blue/yin-yang-graffiti-blue-shirt-4.webp",
			"products/apparel/yin-yang-graffiti-blue/yin-yang-graffiti-blue-tank-top-back.webp",
		],
		description: `I've started with taking a photo of a tree bark transforming it into yin yang, Abalych has drawn a graffiti which I have also placed on some tree texture. After some photoshop manipulations, I have printed it with my own hands on a screen printing machine.`,
	},
	{
		id: "chick-fil-a",
		name: "Chick-fil-A",
		type: "image",
		images: [
			"branding/chickfila/chickfila-1.webp",
			"branding/chickfila/chickfila-2.webp",
			"branding/chickfila/chickfila-3.webp",
			"branding/chickfila/chickfila-4.webp",
			"branding/chickfila/chickfila-5.webp",
		],
		description:
			"As an assignment at Mohawk College I was given a task to create branding items for Chickfila",
		logo: "logos/mohawk-icon.svg",
	},
	{
		id: "adobe",
		name: "Adobe",
		type: "image",
		images: [
			"branding/adobe/adobe-1.webp",
			"branding/adobe/adobe-2.webp",
			"branding/adobe/adobe-3.webp",
		],
		description:
			"As an assignment at Mohawk College I was given a task to create branding items and packaging for Adobe event",
		logo: "logos/mohawk-icon.svg",
	},
	{
		id: "chrysalis",
		name: "Chrysalis",
		type: "image",
		images: [
			"branding/chrysalis/chrysalis-1.webp",
			"branding/chrysalis/chrysalis-2.webp",
		],
		//TODO: add link to animation?
		//TODO: add link to hamilton reads event
		description:
			'While working as an intern at the Hamilton Public Library (center branch), I have successfully accomplished a task of creating branding identity for a city-wide event "Hamilton Reads" which had as its book "Chrysalis". I have created not only the posters which you can see here, but also an animation.',
		logo: "logos/hpl.svg",
	},
	{
		id: "cayuga",
		name: "Cayuga",
		type: "image",
		images: [
			"branding/cayuga/cayuga-1.webp",
			"branding/cayuga/cayuga-2.webp",
			"branding/cayuga/cayuga-3.webp",
		],
		description:
			"As an assignment at Mohawk College I was given a task to create a logo for a printing company in Ontario called Cayuga",
		logo: "logos/mohawk-icon.svg",
	},
	{
		id: "nutrition-box",
		name: "Nutrition Box",
		type: "image",
		images: [
			"branding/nutrition-box/nutrition-box-1.webp",
			"branding/nutrition-box/nutrition-box-2.webp",
			"branding/nutrition-box/nutrition-box-3.webp",
			"branding/nutrition-box/nutrition-box-4.webp",
			"branding/nutrition-box/nutrition-box-5.webp",
			"branding/nutrition-box/nutrition-box-6.webp",
		],
		//TODO: name correct?
		description: `I've created packaging for Optimum Nutrition as a part of the Graphic Design program at Mohawk College`,
		logo: "logos/mohawk-icon.svg",
	},
	{
		id: "emmanuel",
		name: "Emmanuel",
		type: "image",
		images: [
			"branding/emmanuel/emmanuel-1.webp",
			"branding/emmanuel/emmanuel-2.webp",
		],
		//TODO: which election? student association?
		description: `I've helped a friend at my College by creating him a poster for his election`,
		logo: "logos/mohawk-icon.svg",
	},
	{
		id: "hpl",
		name: "HPL",
		type: "video",
		preview: "branding/hpl-animation/hpl-animation-preview.jpg",
		src: "branding/hpl-animation/hpl-animation.mp4",
		//TODO: add link to posters
		//TODO: add link to hamilton reads event
		//TODO: year long? really?
		description: `This is a piece for "Hamilton Reads" year-long event in my city's library, which I've done branding identity for. It included posters and this animation.`,
		logo: "logos/hpl.svg",
	},
	{
		id: "querido",
		name: "Querido",
		type: "image",
		images: [
			"branding/querido/querido-1.webp",
			"branding/querido/querido-2.webp",
			"branding/querido/querido-3.webp",
			"branding/querido/querido-4.webp",
		],
		//TODO: whose?
		description: `A logo for Querido — a company whose goal is to provide horse owners with high quality toys for their animals, improving their wellbeing.`,
		logo: "logos/mohawk-icon.svg",
	},
	{
		id: "design-shirt",
		name: "Design Shirt",
		type: "image",
		images: [
			"branding/design-shirt/design-shirt-1.webp",
			"branding/design-shirt/design-shirt-2.webp",
		],
		description:
			"A shirt I have made for an open-ended Mohawk College assignment. Printed with a digital printer.",
		logo: "logos/mohawk-icon.svg",
	},
];
