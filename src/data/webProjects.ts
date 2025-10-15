import type { Project } from "~/components/ui/studio/web/webTypes";

export const webProjects: Project[] = [
	{
		id: "abalych",
		title: "Abalych WorldWide",
		description:
			"Website design and development for a street artist Kristina, known as Abalych, who blends traditional with modern, east with west, void with form.",
		tools: [
			{
				name: "Figma",
				icon: "logos/figma-text.svg",
			},
			{
				name: "Vite",
				icon: "logos/vite.svg",
				largeIcon: true,
			},
			{
				name: "React",
				icon: "logos/react.svg",
				largeIcon: true,
			},
			{
				name: "Cloudflare",
				icon: "logos/cloudflare.png",
			},
			{
				name: "hashBlur",
			},
			{
				name: "Motion",
				icon: "logos/motion.png",
				largeIcon: true,
			},
		],
		websiteUrl: "https://www.abaly.ch/",
		layout: "full",
		devices: [
			{
				type: "tablet",
				content: {
					type: "video",
					url: "web/abalych/abalych.mp4",
				},
			},
		],
	},
	{
		id: "africa-power-supply",
		title: "Africa Power Supply",
		description:
			"Website design and development for Africa Power Supply, a fresh Canadian startup planning to revolutionize the African clean energy industry.",
		tools: [
			{
				name: "Webflow",
				icon: "logos/webflow-text.svg",
			},
		],
		websiteUrl: "https://aps-cb63ae.webflow.io/",
		layout: "full",
		devices: [
			{
				type: "phone",
				content: {
					type: "video",
					url: "web/aps/aps_iphone.mp4",
				},
			},
			{
				type: "tablet",
				content: {
					type: "video",
					url: "web/aps/aps_tablet.mp4",
				},
			},
		],
	},
	{
		id: "beautyfloor",
		title: "BeautyFloor",
		description:
			"Website design and development for BeautyFloor, a premium flooring company specializing in high-quality laminate and hardwood floors.",
		tools: [
			{
				name: "Figma",
				icon: "logos/figma-text.svg",
			},
			{
				name: "WordPress",
				icon: "logos/wordpress.svg",
			},
		],
		websiteUrl: "https://bfloor.ru/",
		layout: "full",
		devices: [
			{
				type: "desktop",
				content: {
					type: "image",
					url: "web/bfloor/bfloor1.webp",
				},
			},
			{
				type: "desktop",
				content: {
					type: "image",
					url: "web/bfloor/bfloor2.webp",
				},
			},
			{
				type: "phone",
				content: {
					type: "image",
					url: "web/bfloor/bfloor3.webp",
				},
			},
			{
				type: "tablet",
				content: {
					type: "video",
					url: "web/bfloor/bfloor_tablet.mp4",
				},
			},
		],
	},
	{
		id: "karata-32",
		title: "32KARATA",
		description: "Website design and development for a dentist clinic 32KARATA",
		tools: [
			{
				name: "Spline",
				icon: "spline.png",
			},
			{
				name: "Webflow",
				icon: "logos/webflow-text.svg",
			},
		],
		websiteUrl: "https://rublevsky-studio.webflow.io/32karata/home",
		layout: "tablet-only",
		devices: [
			{
				type: "tablet",
				content: {
					type: "video",
					url: "web/32karata/32karata_tablet.mp4",
				},
			},
		],
	},
	{
		id: "inksoul",
		title: "InkSoul",
		description:
			"Website design and development for InkSoul, a Tattoo studio with a grounded, personalized approach, specializing in graphical and ornamental styles",
		tools: [
			{
				name: "Figma",
				icon: "logos/figma-text.svg",
			},
			{
				name: "Webflow",
				icon: "logos/webflow-text.svg",
			},
		],
		websiteUrl: "https://inksoul.webflow.io/",
		layout: "full",
		devices: [
			{
				type: "phone",
				content: {
					type: "video",
					url: "web/inksoul/inksoul-iphone.mp4",
				},
			},
			{
				type: "tablet",
				content: {
					type: "video",
					url: "web/inksoul/inksoul-tablet.mp4",
				},
			},
		],
	},
	{
		id: "femtech",
		title: "FemTech",
		description:
			"Website design and development for FemTech, an innovative company focused on women's health technology solutions.",
		tools: [
			{
				name: "Figma",
				icon: "logos/figma-text.svg",
			},
			{
				name: "Webflow",
				icon: "logos/webflow-text.svg",
			},
		],
		websiteUrl: "https://www.femtechsearch.com/",
		layout: "full",
		devices: [
			{
				type: "phone",
				content: {
					type: "video",
					url: "femtech_iphone.mp4",
				},
			},
			{
				type: "tablet",
				content: {
					type: "video",
					url: "femtech_tablet.mp4",
				},
			},
		],
	},
];
