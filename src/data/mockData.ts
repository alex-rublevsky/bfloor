//TODO add relevant brands for tea

//TODO tea name to include sheng/shou
// tea category to inclue raw/ripe/white/green/oolong/gaba

// Mock Categories
export const mockCategories = [
	{
		name: "Apparel",
		slug: "apparel",
		isActive: true,
	},
	{
		name: "Stickers",
		slug: "stickers",
		isActive: true,
	},
	{
		name: "Tea",
		slug: "tea",
		isActive: true,
	},
	{
		name: "Produce",
		slug: "produce",
		isActive: true,
	},
	{
		name: "Posters",
		slug: "posters",
		isActive: true,
	},
];

export const mockTeaCategories = [
	{
		name: "Ripe Pu'er",
		slug: "ripe-pu-er",
		isActive: true,
	},
	{
		name: "Raw Pu'er",
		slug: "raw-pu-er",
		isActive: true,
	},
	{
		name: "White",
		slug: "white",
		isActive: true,
	},
	{
		name: "Green",
		slug: "green",
		isActive: true,
	},
	{
		name: "Oolong",
		slug: "oolong",
		isActive: true,
	},
	{
		name: "Purple",
		slug: "purple",
		isActive: true,
	},
	{
		name: "Gaba",
		slug: "gaba",
		isActive: true,
	},
	{
		name: "Ancient Trees",
		slug: "ancient-trees",
		isActive: true,
	},
];

// Mock Brands
export const mockBrands = [
	{
		name: "Rublevsky Studio",
		slug: "rublevsky-studio",
		isActive: true,
	},
	{
		name: "Yunnan Sourcing",
		slug: "yunnan-sourcing",
		isActive: true,
	},
	{
		name: "Podarki Vostoka",
		slug: "podarki-vostoka",
		isActive: true,
	},
	{
		name: "Art of Tea",
		slug: "art-of-tea",
		isActive: true,
	},
	{
		name: "Abalych",
		slug: "abalych",
		isActive: true,
	},
	{
		name: "Rublevsky Studio & Abalych",
		slug: "rublevsky-studio-abalych",
		isActive: true,
	},
];

// Mock Products
export const mockProducts = [
	{
		name: "White Gaiwan with a Saucer, 100 ml",
		slug: "white-gaiwan-with-a-saucer-100-ml",
		description: "A small ceramic gaiwan",
		images: "gaiwan-1-1.jpg, gaiwan-1-2.jpg",
		price: 10,
		stock: 1,
		isActive: true,
		isFeatured: false,
		discount: null,
		hasVariations: false,
		unlimitedStock: false,
		categorySlug: "tea",
		brandSlug: "rublevsky-studio",
	},
	{
		name: "Mulberry Jam",
		slug: "mulberry-jam",
		description:
			"50% less sugar than the store-bought brands. Home grown mulberries! The berries are whole, and the consistency is semi-liquid.",
		images: "jam-mulberry.jpg, mulberry.jpg",
		price: 15,
		stock: 4,
		isActive: true,
		isFeatured: false,
		discount: null,
		hasVariations: false,
		unlimitedStock: false,
		categorySlug: "produce",
		brandSlug: "rublevsky-studio",
	},
	{
		name: "Bark Graffiti Abalych 2.0 Poster",
		slug: "bark-graffiti-abalych-20-poster",
		description: "Abalych calligraphy x Rublevsky studio photography\n2024",
		images:
			"bark-graffiti-abalych-print-poster-red.jpg, bark-graffiti-abalych-print-poster-blue.jpg",
		stock: 0,
		price: 0,
		isActive: true,
		isFeatured: false,
		discount: null,
		hasVariations: true,
		unlimitedStock: false,
		categorySlug: "posters",
		brandSlug: "rublevsky-studio-abalych",
		variations: JSON.stringify([
			{
				sku: "bark-graffiti-abalych-20-poster-red",
				price: 13.0,
				stock: 2,
				sort: 0,
				attributes: [
					{
						attributeId: "COLOR",
						value: "Red",
					},
				],
			},
			{
				sku: "bark-graffiti-abalych-20-poster-blue",
				price: 13.0,
				stock: 2,
				sort: 1,
				attributes: [
					{
						attributeId: "COLOR",
						value: "Blue",
					},
				],
			},
		]),
	},
	{
		name: "Bark Graffiti Abalych 1.0 Poster",
		slug: "bark-graffiti-abalych-10-poster",
		description: "Abalych calligraphy x Rublevsky studio photography\n2024",
		images: "bark-graffiti-abalych-print-poster-brown.jpg",
		price: 13.0,
		isActive: true,
		isFeatured: false,
		discount: null,
		hasVariations: false,
		stock: 2,
		unlimitedStock: false,
		categorySlug: "posters",
		brandSlug: "rublevsky-studio-abalych",
	},
	{
		name: "Squirrel Sticker",
		slug: "squirrel-sticker",
		description: "Cute and awesome, I have nothing else to say...",
		images: "squirrel-sticker.jpg, squirrel-sticker-preview.jpg",
		price: 0,
		isActive: true,
		isFeatured: false,
		discount: null,
		hasVariations: true,
		stock: 0,
		unlimitedStock: true,
		categorySlug: "stickers",
		brandSlug: "rublevsky-studio",
		variations: JSON.stringify([
			{
				sku: "squirrel-sticker-6x6",
				price: 3.0,
				stock: 0,
				sort: 0,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "6x6",
					},
				],
			},
			{
				sku: "squirrel-sticker-8x8",
				price: 4.0,
				stock: 0,
				sort: 1,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "8x8",
					},
				],
			},
			{
				sku: "squirrel-sticker-10x10",
				price: 4.0,
				stock: 0,
				sort: 2,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "10x10",
					},
				],
			},
			{
				sku: "squirrel-sticker-12x12",
				price: 5.0,
				stock: 0,
				sort: 3,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "12x12",
					},
				],
			},
			{
				sku: "squirrel-sticker-14x14",
				price: 5.0,
				stock: 0,
				sort: 4,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "14x14",
					},
				],
			},
		]),
	},
	{
		name: "Mushroom Girl Sticker",
		slug: "mushroom-girl-sticker",
		description: "Mycelium!",
		images: "devochka.jpg, devochka-preview.jpg",
		price: 0,
		isActive: true,
		isFeatured: false,
		discount: null,
		hasVariations: true,
		stock: 0,
		unlimitedStock: true,
		categorySlug: "stickers",
		brandSlug: "abalych",
		variations: JSON.stringify([
			{
				sku: "mushroom-girl-sticker-6x8-4",
				price: 3.0,
				stock: 0,
				sort: 0,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "6x8.4",
					},
				],
			},
			{
				sku: "mushroom-girl-sticker-6x11-3",
				price: 4.0,
				stock: 0,
				sort: 1,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "6x11.3",
					},
				],
			},
			{
				sku: "mushroom-girl-sticker-10x14-1",
				price: 4.0,
				stock: 0,
				sort: 2,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "10x14.1",
					},
				],
			},
			{
				sku: "mushroom-girl-sticker-12x16-9",
				price: 5.0,
				stock: 0,
				sort: 3,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "12x16.9",
					},
				],
			},
			{
				sku: "mushroom-girl-sticker-14x19-7",
				price: 5.0,
				stock: 0,
				sort: 4,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "14x19.7",
					},
				],
			},
		]),
	},
	{
		name: "Shroom Brain Sticker",
		slug: "shroom-brain-sticker",
		description: "Psychedelic experience",
		images: "shroom-brain.jpg, shroom-brain-preview.jpg",
		price: 0,
		isActive: true,
		isFeatured: false,
		discount: null,
		hasVariations: true,
		stock: 0,
		unlimitedStock: true,
		categorySlug: "stickers",
		brandSlug: "abalych",
		variations: JSON.stringify([
			{
				sku: "shroom-brain-sticker-6x8-4",
				price: 3.0,
				stock: 0,
				sort: 0,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "6x8.4",
					},
				],
			},
			{
				sku: "shroom-brain-sticker-8x11-2",
				price: 4.0,
				stock: 0,
				sort: 1,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "8x11.2",
					},
				],
			},
			{
				sku: "shroom-brain-sticker-10x14-1",
				price: 4.0,
				stock: 0,
				sort: 2,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "10x14.1",
					},
				],
			},
			{
				sku: "shroom-brain-sticker-12x16-9",
				price: 5.0,
				stock: 0,
				sort: 3,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "12x16.9",
					},
				],
			},
			{
				sku: "shroom-brain-sticker-14x19-7",
				price: 5.0,
				stock: 0,
				sort: 4,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "14x19.7",
					},
				],
			},
		]),
	},
	{
		name: "Swirl Sticker",
		slug: "swirl-sticker",
		description: "Interconnected interaction",
		images: "triple-person-swirl.jpg, triple-person-swirl-preview.jpg",
		price: 0,
		isActive: true,
		isFeatured: false,
		discount: null,
		hasVariations: true,
		stock: 0,
		unlimitedStock: true,
		categorySlug: "stickers",
		brandSlug: "abalych",
		variations: JSON.stringify([
			{
				sku: "swirl-sticker-6x6-1",
				price: 3.0,
				stock: 0,
				sort: 0,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "6x6.1",
					},
				],
			},
			{
				sku: "swirl-sticker-8x8-2",
				price: 4.0,
				stock: 0,
				sort: 1,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "8x8.2",
					},
				],
			},
			{
				sku: "swirl-sticker-10x10-2",
				price: 4.0,
				stock: 0,
				sort: 2,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "10x10.2",
					},
				],
			},
			{
				sku: "swirl-sticker-12x12-3",
				price: 5.0,
				stock: 0,
				sort: 3,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "12x12.3",
					},
				],
			},
			{
				sku: "swirl-sticker-14x14-3",
				price: 5.0,
				stock: 0,
				sort: 4,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "14x14.3",
					},
				],
			},
		]),
	},
	{
		name: "Leaf Sticker",
		slug: "leaf-sticker",
		description: "Photosynthesis :)",
		images: "leaf.jpg, leaf-preview.jpg",
		price: 0,
		isActive: true,
		isFeatured: false,
		discount: null,
		hasVariations: true,
		stock: 0,
		unlimitedStock: true,
		categorySlug: "stickers",
		brandSlug: "abalych",
		variations: JSON.stringify([
			{
				sku: "leaf-sticker-6x6-6",
				price: 3.0,
				stock: 0,
				sort: 0,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "6x6.6",
					},
				],
			},
			{
				sku: "leaf-sticker-8x8-7",
				price: 4.0,
				stock: 0,
				sort: 1,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "8x8.7",
					},
				],
			},
			{
				sku: "leaf-sticker-10x11",
				price: 4.0,
				stock: 0,
				sort: 2,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "10x11",
					},
				],
			},
			{
				sku: "leaf-sticker-12x13-1",
				price: 5.0,
				stock: 0,
				sort: 3,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "12x13.1",
					},
				],
			},
			{
				sku: "leaf-sticker-14x15-3",
				price: 5.0,
				stock: 0,
				sort: 4,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "14x15.3",
					},
				],
			},
		]),
	},
	{
		name: "Shroom Sticker",
		slug: "shroom-sticker",
		description: "The only way our is through!",
		images: "shroom.jpg, shroom-preview.jpg",
		price: 0,
		isActive: true,
		isFeatured: false,
		discount: null,
		hasVariations: true,
		stock: 0,
		unlimitedStock: true,
		categorySlug: "stickers",
		brandSlug: "abalych",
		variations: JSON.stringify([
			{
				sku: "shroom-sticker-6x8-4",
				price: 3.0,
				stock: 0,
				sort: 0,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "6x8.4",
					},
				],
			},
			{
				sku: "shroom-sticker-8x11-2",
				price: 4.0,
				stock: 0,
				sort: 1,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "8x11.2",
					},
				],
			},
			{
				sku: "shroom-sticker-10x14",
				price: 4.0,
				stock: 0,
				sort: 2,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "10x14",
					},
				],
			},
			{
				sku: "shroom-sticker-12x16-9",
				price: 5.0,
				stock: 0,
				sort: 3,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "12x16.9",
					},
				],
			},
			{
				sku: "shroom-sticker-14x19-7",
				price: 5.0,
				stock: 0,
				sort: 4,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "14x19.7",
					},
				],
			},
		]),
	},
	{
		name: "Graffiti Bark Sticker 2.0",
		slug: "graffiti-bark-sticker-2",
		description: "Fractal x Streets",
		images:
			"graffiti-bark-abalych-second.jpg, graffiti-bark-abalych-second-preview.jpg",
		price: 0,
		isActive: true,
		isFeatured: false,
		discount: null,
		hasVariations: true,
		stock: 0,
		unlimitedStock: true,
		categorySlug: "stickers",
		brandSlug: "rublevsky-studio-abalych",
		variations: JSON.stringify([
			{
				sku: "graffiti-bark-sticker-2-6x6",
				price: 3.0,
				stock: 0,
				sort: 0,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "6x6",
					},
				],
			},
			{
				sku: "graffiti-bark-sticker-2-8x8",
				price: 4.0,
				stock: 0,
				sort: 1,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "8x8",
					},
				],
			},
			{
				sku: "graffiti-bark-sticker-2-10x10",
				price: 4.0,
				stock: 0,
				sort: 2,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "10x10",
					},
				],
			},
			{
				sku: "graffiti-bark-sticker-2-12x12",
				price: 5.0,
				stock: 0,
				sort: 3,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "12x12",
					},
				],
			},
			{
				sku: "graffiti-bark-sticker-2-14x14",
				price: 5.0,
				stock: 0,
				sort: 4,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "14x14",
					},
				],
			},
		]),
	},
	{
		name: "Graffiti Bark Sticker 1.0",
		slug: "graffiti-bark-sticker-1",
		description: "Fractal x Streets",
		images: "graffiti-bark-abalych-1.jpg, graffiti-bark-abalych-1-preview.jpg",
		price: 0,
		isActive: true,
		isFeatured: false,
		discount: null,
		hasVariations: true,
		stock: 0,
		unlimitedStock: true,
		categorySlug: "stickers",
		brandSlug: "rublevsky-studio-abalych",
		variations: JSON.stringify([
			{
				sku: "graffiti-bark-sticker-1-6x6",
				price: 3.0,
				stock: 0,
				sort: 0,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "6x6",
					},
				],
			},
			{
				sku: "graffiti-bark-sticker-1-8x8",
				price: 4.0,
				stock: 0,
				sort: 1,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "8x8",
					},
				],
			},
			{
				sku: "graffiti-bark-sticker-1-10x10",
				price: 4.0,
				stock: 0,
				sort: 2,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "10x10",
					},
				],
			},
			{
				sku: "graffiti-bark-sticker-1-12x12",
				price: 5.0,
				stock: 0,
				sort: 3,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "12x12",
					},
				],
			},
			{
				sku: "graffiti-bark-sticker-1-14x14",
				price: 5.0,
				stock: 0,
				sort: 4,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "14x14",
					},
				],
			},
		]),
	},
	{
		name: "Yin Yang",
		slug: "yin-yang-sticker",
		description: "Eternally balanced, at peace",
		images: "yinyan.jpg, yinyan-preview.jpg",
		price: 0,
		isActive: true,
		isFeatured: false,
		discount: null,
		hasVariations: true,
		stock: 0,
		unlimitedStock: true,
		categorySlug: "stickers",
		brandSlug: "rublevsky-studio",
		variations: JSON.stringify([
			{
				sku: "yin-yang-sticker-6x6",
				price: 3.0,
				stock: 0,
				sort: 0,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "6x6",
					},
				],
			},
			{
				sku: "yin-yang-sticker-8x8",
				price: 4.0,
				stock: 0,
				sort: 1,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "8x8",
					},
				],
			},
			{
				sku: "yin-yang-sticker-10x10",
				price: 4.0,
				stock: 0,
				sort: 2,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "10x10",
					},
				],
			},
			{
				sku: "yin-yang-sticker-12x12",
				price: 5.0,
				stock: 0,
				sort: 3,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "12x12",
					},
				],
			},
			{
				sku: "yin-yang-sticker-14x14",
				price: 5.0,
				stock: 0,
				sort: 4,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "14x14",
					},
				],
			},
		]),
	},
	{
		name: "God Nature Art Peace & Hip Hop Sticker",
		slug: "god-nature-art-peace-hip-hop-sticker",
		description:
			"Творчество говорит само за себя, если бы я могла это описать — я бы не сделала стикос.\n— Abalych",
		images: "hiphop1.jpg, hiphop2.jpg, hiphop-preview.jpg",
		price: 0,
		isActive: true,
		isFeatured: false,
		discount: null,
		hasVariations: true,
		stock: 0,
		unlimitedStock: true,
		categorySlug: "stickers",
		brandSlug: "abalych",
		variations: JSON.stringify([
			{
				sku: "god-nature-art-peace-hip-hop-sticker-6x8-1",
				price: 3.0,
				stock: 0,
				sort: 0,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "6x8.1",
					},
				],
			},
			{
				sku: "god-nature-art-peace-hip-hop-sticker-8x10-8",
				price: 4.0,
				stock: 0,
				sort: 1,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "8x10.8",
					},
				],
			},
			{
				sku: "god-nature-art-peace-hip-hop-sticker-10x13-5",
				price: 4.0,
				stock: 0,
				sort: 2,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "10x13.5",
					},
				],
			},
			{
				sku: "god-nature-art-peace-hip-hop-sticker-12x16-2",
				price: 5.0,
				stock: 0,
				sort: 3,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "12x16.2",
					},
				],
			},
			{
				sku: "god-nature-art-peace-hip-hop-sticker-14x19",
				price: 5.0,
				stock: 0,
				sort: 4,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "14x19",
					},
				],
			},
		]),
	},
	{
		name: "Yin Yang Graffiti Blue",
		slug: "yin-yang-graffiti-blue",
		description: "Rublevsky studio x Abalych\n2024",
		images:
			"yin-yan-shirt-7.jpg, yin-yan-shirt-6.jpg, yin-yan-shirt-5.jpg, yin-yan-shirt-4.jpg, yin-yan-shirt-3.jpg, yin-yan-shirt-2.jpg, yin-yan-shirt-1.jpg",
		price: 0,
		isActive: true,
		isFeatured: true,
		discount: null,
		hasVariations: true,
		stock: 0,
		unlimitedStock: false,
		categorySlug: "apparel",
		brandSlug: "rublevsky-studio-abalych",
		variations: JSON.stringify([
			{
				sku: "yin-yang-graffiti-blue-hoodie-xl",
				price: 55,
				stock: 4,
				sort: 0,
				attributes: [
					{
						attributeId: "APPAREL_TYPE",
						value: "Hoodie",
					},
					{
						attributeId: "SIZE",
						value: "XL",
					},
				],
			},
			{
				sku: "yin-yang-graffiti-blue-shirt-xxl",
				price: 49.99,
				stock: 2,
				sort: 0,
				attributes: [
					{
						attributeId: "APPAREL_TYPE",
						value: "Shirt",
					},
					{
						attributeId: "SIZE",
						value: "XXL",
					},
				],
			},
			{
				sku: "yin-yang-graffiti-blue-shirt-xl",
				price: 45,
				stock: 3,
				sort: 0,
				attributes: [
					{
						attributeId: "APPAREL_TYPE",
						value: "Shirt",
					},
					{
						attributeId: "SIZE",
						value: "XL",
					},
				],
			},
		]),
	},
	{
		name: "Yin Yang Graffiti Red",
		slug: "yin-yang-graffiti-red",
		description: "Rublevsky studio x Abalych\n2025",
		images: "red-graffiti-1.jpg, red-graffiti-2.jpg",
		price: 0,
		isActive: true,
		isFeatured: true,
		discount: null,
		hasVariations: true,
		stock: 0,
		unlimitedStock: false,
		categorySlug: "apparel",
		brandSlug: "rublevsky-studio-abalych",
		variations: JSON.stringify([
			{
				sku: "yin-yang-graffiti-red-xl",
				price: 49.99,
				stock: 2,
				sort: 0,
				attributes: [
					{
						attributeId: "APPAREL_TYPE",
						value: "Hoodie",
					},
					{
						attributeId: "SIZE",
						value: "XL",
					},
				],
			},
			{
				sku: "yin-yang-graffiti-red-xxl",
				price: 49.99,
				stock: 1,
				sort: 1,
				attributes: [
					{
						attributeId: "APPAREL_TYPE",
						value: "Hoodie",
					},
					{
						attributeId: "SIZE",
						value: "XXL",
					},
				],
			},
		]),
	},
	{
		name: `Ku Zhu Shan "Guardian 2.0" Ripe Pu'er`,
		slug: "ku-zhu-shan-guardian-20-ripe-puer",
		teaCategories: ["ripe-pu-er"],
		description: "Linked to blog post with the same slug",
		images:
			"products/ripe-puer-ku-zhu-shan-guardian-20-1.jpg, products/ripe-puer-ku-zhu-shan-guardian-20-2.jpg, products/ripe-puer-ku-zhu-shan-guardian-20-3.jpg, products/ripe-puer-ku-zhu-shan-guardian-20-4.jpg, products/ripe-puer-ku-zhu-shan-guardian-20-5.jpg, products/ripe-puer-ku-zhu-shan-guardian-20-6.jpg",
		price: 0,
		isActive: true,
		isFeatured: true,
		discount: null,
		hasVariations: true,
		weight: "150",
		stock: 0,
		unlimitedStock: false,
		categorySlug: "tea",
		brandSlug: "podarki-vostoka",
		variations: JSON.stringify([
			{
				sku: "ku-zhu-shan-guardian-20-ripe-puer-25g",
				price: 12,
				stock: 0,
				sort: 0,
				attributes: [
					{
						attributeId: "WEIGHT_G",
						value: "25",
					},
				],
			},
			{
				sku: "ku-zhu-shan-guardian-20-ripe-puer-50g",
				price: 23,
				stock: 0,
				sort: 1,
				attributes: [
					{
						attributeId: "WEIGHT_G",
						value: "50",
					},
				],
			},
			{
				sku: "ku-zhu-shan-guardian-20-ripe-puer-75g",
				price: 32,
				stock: 0,
				sort: 2,
				attributes: [
					{
						attributeId: "WEIGHT_G",
						value: "75",
					},
				],
			},
			{
				sku: "ku-zhu-shan-guardian-20-ripe-puer-100g",
				price: 42,
				stock: 0,
				sort: 3,
				attributes: [
					{
						attributeId: "WEIGHT_G",
						value: "100",
					},
				],
			},
			{
				sku: "ku-zhu-shan-guardian-20-ripe-puer-125g",
				price: 53,
				stock: 0,
				sort: 4,
				attributes: [
					{
						attributeId: "WEIGHT_G",
						value: "125",
					},
				],
			},
			{
				sku: "ku-zhu-shan-guardian-20-ripe-puer-150g",
				price: 63,
				stock: 0,
				sort: 5,
				attributes: [
					{
						attributeId: "WEIGHT_G",
						value: "150",
					},
				],
			},
		]),
	},
	{
		name: "2023 Purple Yue Guang Bai",
		slug: "2023-purple-yue-guang-bai",
		teaCategories: ["white", "purple"],
		description: "Linked to blog post with the same slug",
		images:
			"products/purple-yue-guan-bai-2023-1.jpg, products/purple-yue-guan-bai-2023-2.jpg, products/purple-yue-guan-bai-2023-3.jpg, products/purple-yue-guan-bai-2023-4.jpg, products/purple-yue-guan-bai-2023-5.jpg",
		price: 0,
		isActive: true,
		isFeatured: true,
		discount: null,
		hasVariations: true,
		weight: "300",
		stock: 0,
		unlimitedStock: false,
		categorySlug: "tea",
		brandSlug: "yunnan-sourcing",
		variations: JSON.stringify([
			{
				sku: "2023-purple-yue-guang-bai-25g",
				price: 11,
				stock: 0,
				sort: 0,
				attributes: [
					{
						attributeId: "WEIGHT_G",
						value: "25",
					},
				],
			},
			{
				sku: "2023-purple-yue-guang-bai-50g",
				price: 21,
				stock: 0,
				sort: 1,
				attributes: [
					{
						attributeId: "WEIGHT_G",
						value: "50",
					},
				],
			},
			{
				sku: "2023-purple-yue-guang-bai-75g",
				price: 29,
				stock: 0,
				sort: 1,
				attributes: [
					{
						attributeId: "WEIGHT_G",
						value: "50",
					},
				],
			},
			{
				sku: "2023-purple-yue-guang-bai-100g",
				price: 38,
				stock: 0,
				sort: 2,
				attributes: [
					{
						attributeId: "WEIGHT_G",
						value: "100",
					},
				],
			},
			{
				sku: "2023-purple-yue-guang-bai-115g",
				price: 44,
				stock: 0,
				sort: 3,
				attributes: [
					{
						attributeId: "WEIGHT_G",
						value: "150",
					},
				],
			},
		]),
	},
	{
		name: "Skateboard Cat Sticker",
		slug: "skateboard-cat-sticker",
		description: "cool af!",
		images: "skateboard-cat-sticker-1.jpg, skateboard-cat-preview.jpg",
		price: 0,
		isActive: true,
		isFeatured: false,
		discount: null,
		hasVariations: true,
		stock: 0,
		unlimitedStock: true,
		categorySlug: "stickers",
		brandSlug: "rublevsky-studio",
		variations: JSON.stringify([
			{
				sku: "skateboard-cat-sticker-6x4-3",
				price: 3.0,
				stock: 0,
				sort: 0,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "6x4.3",
					},
				],
			},
			{
				sku: "skateboard-cat-sticker-8x5-7",
				price: 4.0,
				stock: 0,
				sort: 1,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "8x5.7",
					},
				],
			},
			{
				sku: "skateboard-cat-sticker-10x7-1",
				price: 4.0,
				stock: 0,
				sort: 2,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "10x7.1",
					},
				],
			},
			{
				sku: "skateboard-cat-sticker-12x8-6",
				price: 5.0,
				stock: 0,
				sort: 3,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "12x8.6",
					},
				],
			},
			{
				sku: "skateboard-cat-sticker-14x10",
				price: 5.0,
				stock: 0,
				sort: 4,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "14x10",
					},
				],
			},
		]),
	},
	{
		name: "Birch Sticker",
		slug: "birch-sticker",
		description: "Illegal eternity",
		images: "birch.jpg, birch-preview.JPG",
		price: 0,
		isActive: true,
		isFeatured: false,
		discount: null,
		hasVariations: true,
		stock: 0,
		unlimitedStock: true,
		categorySlug: "stickers",
		brandSlug: "abalych",
		variations: JSON.stringify([
			{
				sku: "birch-sticker-6x8",
				price: 3.0,
				stock: 0,
				sort: 0,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "6x8",
					},
				],
			},
			{
				sku: "birch-sticker-8x10-6",
				price: 4.0,
				stock: 0,
				sort: 1,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "8x10.6",
					},
				],
			},
			{
				sku: "birch-sticker-10x13-3",
				price: 4.0,
				stock: 0,
				sort: 2,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "10x13.3",
					},
				],
			},
			{
				sku: "birch-sticker-12x16",
				price: 5.0,
				stock: 0,
				sort: 3,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "12x16",
					},
				],
			},
			{
				sku: "birch-sticker-14x18-6",
				price: 5.0,
				stock: 0,
				sort: 4,
				attributes: [
					{
						attributeId: "SIZE_CM",
						value: "14x18.6",
					},
				],
			},
		]),
	},

	{
		name: "Spring 2009 Lincang Arbor Gong Ting Ripe Pu'er",
		slug: "2009-spring-lincang-arbor-gong-ting-ripe-puer",
		teaCategories: ["ripe-pu-er"],
		description: "Linked to blog post with the same slug",
		images:
			"products/lincang-arbor-gong-ting-ripe-puer-2009-spring-1.jpg, products/lincang-arbor-gong-ting-ripe-puer-2009-spring-2.jpg, products/lincang-arbor-gong-ting-ripe-puer-2009-spring-3.jpg, products/lincang-arbor-gong-ting-ripe-puer-2009-spring-4.jpg, products/lincang-arbor-gong-ting-ripe-puer-2009-spring-5.jpg, products/lincang-arbor-gong-ting-ripe-puer-2009-spring-6.jpg",
		price: 0,
		isActive: true,
		isFeatured: true,
		discount: null,
		hasVariations: true,
		weight: "150",
		stock: 0,
		unlimitedStock: false,
		categorySlug: "tea",
		brandSlug: "yunnan-sourcing",
		variations: JSON.stringify([
			{
				sku: "2009-spring-lincang-arbor-gong-ting-ripe-puer-25g",
				price: 17.0,
				stock: 0,
				sort: 1,
				attributes: [
					{
						attributeId: "WEIGHT_G",
						value: "25",
					},
				],
			},
			{
				sku: "2009-spring-lincang-arbor-gong-ting-ripe-puer-50g",
				price: 31.0,
				stock: 0,
				sort: 2,
				attributes: [
					{
						attributeId: "WEIGHT_G",
						value: "50",
					},
				],
			},
			{
				sku: "2009-spring-lincang-arbor-gong-ting-ripe-puer-75g",
				price: 43.0,
				stock: 0,
				sort: 3,
				attributes: [
					{
						attributeId: "WEIGHT_G",
						value: "75",
					},
				],
			},
			{
				sku: "2009-spring-lincang-arbor-gong-ting-ripe-puer-100g",
				price: 57.0,
				stock: 0,
				sort: 4,
				attributes: [
					{
						attributeId: "WEIGHT_G",
						value: "100",
					},
				],
			},
			{
				sku: "2009-spring-lincang-arbor-gong-ting-ripe-puer-150g",
				price: 86.0,
				stock: 0,
				sort: 5,
				attributes: [
					{
						attributeId: "WEIGHT_G",
						value: "150",
					},
				],
			},
		]),
	},
	{
		name: "2024 Mengku x Menghai Ripe Pu'er",
		slug: "2024-mengku-x-menghai-ripe-puer",
		teaCategories: ["ripe-pu-er"],
		description: "Linked to blog post with the same slug",
		images:
			"products/mengku-x-menghai-ripe-puer-2024-1.jpg, products/mengku-x-menghai-ripe-puer-2024-2.jpg, products/mengku-x-menghai-ripe-puer-2024-3.jpg, products/mengku-x-menghai-ripe-puer-2024-4.jpg, products/mengku-x-menghai-ripe-puer-2024-5.jpg",
		price: 0,
		isActive: true,
		isFeatured: true,
		discount: null,
		hasVariations: true,
		weight: "145",
		stock: 0,
		unlimitedStock: false,
		categorySlug: "tea",
		brandSlug: "yunnan-sourcing",
		variations: JSON.stringify([
			{
				sku: "2024-mengku-x-menghai-ripe-puer-25g",
				price: 5.0,
				stock: 0,
				sort: 1,
				attributes: [
					{
						attributeId: "WEIGHT_G",
						value: "25",
					},
				],
			},
			{
				sku: "2024-mengku-x-menghai-ripe-puer-50g",
				price: 9.0,
				stock: 0,
				sort: 2,
				attributes: [
					{
						attributeId: "WEIGHT_G",
						value: "50",
					},
				],
			},
			{
				sku: "2024-mengku-x-menghai-ripe-puer-75g",
				price: 13.0,
				stock: 0,
				sort: 3,
				attributes: [
					{
						attributeId: "WEIGHT_G",
						value: "75",
					},
				],
			},
			{
				sku: "2024-mengku-x-menghai-ripe-puer-100g",
				price: 17.0,
				stock: 0,
				sort: 4,
				attributes: [
					{
						attributeId: "WEIGHT_G",
						value: "100",
					},
				],
			},
			{
				sku: "2024-mengku-x-menghai-ripe-puer-145g",
				price: 25.0,
				stock: 0,
				sort: 5,
				attributes: [
					{
						attributeId: "WEIGHT_G",
						value: "145",
					},
				],
			},
		]),
	},
	{
		name: "2018 Ma Wei Shan Gong Ting Ripe Pu'er",
		slug: "2018-ma-wei-shan-gong-ting-ripe-puer",
		teaCategories: ["ripe-pu-er"],
		description: "Linked to blog post with the same slug",
		images:
			"products/ma-wei-shan-gong-ting-ripe-puer-2018-1.jpg, products/ma-wei-shan-gong-ting-ripe-puer-2018-2.jpg, products/ma-wei-shan-gong-ting-ripe-puer-2018-3.jpg, products/ma-wei-shan-gong-ting-ripe-puer-2018-4.jpg",
		price: 0,
		isActive: true,
		isFeatured: true,
		discount: null,
		hasVariations: true,
		weight: "30",
		stock: 0,
		unlimitedStock: false,
		categorySlug: "tea",
		brandSlug: "yunnan-sourcing",
		variations: JSON.stringify([
			{
				sku: "2018-ma-wei-shan-gong-ting-ripe-puer-30g",
				price: 17.0,
				stock: 0,
				sort: 1,
				attributes: [
					{
						attributeId: "WEIGHT_G",
						value: "30",
					},
				],
			},
		]),
	},

	{
		name: `Ku Zhu Shan x Kun Lu Shan "Aurora Borealis" Raw Pu'er`,
		slug: "ku-zhu-shan-x-kun-lu-shan-aurora-borealis-raw-puer",
		teaCategories: ["raw-pu-er"],
		description: "Linked to blog post with the same slug",
		images:
			"products/sheng-puer-ku-zhu-shan-x-kun-lu-shan-aurora-borealis-1.jpg, products/sheng-puer-ku-zhu-shan-x-kun-lu-shan-aurora-borealis-2.jpg, products/sheng-puer-ku-zhu-shan-x-kun-lu-shan-aurora-borealis-3.jpg, products/sheng-puer-ku-zhu-shan-x-kun-lu-shan-aurora-borealis-4.jpg, products/sheng-puer-ku-zhu-shan-x-kun-lu-shan-aurora-borealis-5.jpg, products/sheng-puer-ku-zhu-shan-x-kun-lu-shan-aurora-borealis-6.jpg, products/sheng-puer-ku-zhu-shan-x-kun-lu-shan-aurora-borealis-7.jpg",
		price: 0,
		isActive: true,
		isFeatured: true,
		discount: null,
		hasVariations: true,
		weight: "150",
		stock: 0,
		unlimitedStock: false,
		categorySlug: "tea",
		brandSlug: "podarki-vostoka",
		variations: JSON.stringify([
			{
				sku: "ku-zhu-shan-x-kun-lu-shan-aurora-borealis-raw-puer-25g",
				price: 15.0,
				stock: 0,
				sort: 0,
				attributes: [
					{
						attributeId: "WEIGHT_G",
						value: "25",
					},
				],
			},
			{
				sku: "ku-zhu-shan-x-kun-lu-shan-aurora-borealis-raw-puer-50g",
				price: 27.0,
				stock: 0,
				sort: 1,
				attributes: [
					{
						attributeId: "WEIGHT_G",
						value: "50",
					},
				],
			},
			{
				sku: "ku-zhu-shan-x-kun-lu-shan-aurora-borealis-raw-puer-75g",
				price: 37.0,
				stock: 0,
				sort: 2,
				attributes: [
					{
						attributeId: "WEIGHT_G",
						value: "75",
					},
				],
			},
			{
				sku: "ku-zhu-shan-x-kun-lu-shan-aurora-borealis-raw-puer-100g",
				price: 49.0,
				stock: 0,
				sort: 3,
				attributes: [
					{
						attributeId: "WEIGHT_G",
						value: "100",
					},
				],
			},
			{
				sku: "ku-zhu-shan-x-kun-lu-shan-aurora-borealis-raw-puer-125g",
				price: 62.0,
				stock: 0,
				sort: 4,
				attributes: [
					{
						attributeId: "WEIGHT_G",
						value: "125",
					},
				],
			},
			{
				sku: "ku-zhu-shan-x-kun-lu-shan-aurora-borealis-raw-puer-150g",
				price: 74.0,
				stock: 0,
				sort: 5,
				attributes: [
					{
						attributeId: "WEIGHT_G",
						value: "150",
					},
				],
			},
		]),
	},
	{
		name: `2019 Menghai "Shugar" Ripe Pu'er`,
		slug: "2019-menghai-shugar-ripe-puer",
		teaCategories: ["ripe-pu-er"],
		description: "Linked to blog post with the same slug",
		images:
			"products/ripe-puer-shugar-menghai-2019-1.jpg, products/ripe-puer-shugar-menghai-2019-2.jpg, products/ripe-puer-shugar-menghai-2019-3.jpg, products/ripe-puer-shugar-menghai-2019-4.jpg, products/ripe-puer-shugar-menghai-2019-5.jpg",
		price: 0,
		isActive: true,
		isFeatured: true,
		discount: null,
		hasVariations: true,
		weight: "150",
		stock: 0,
		unlimitedStock: false,
		categorySlug: "tea",
		brandSlug: "art-of-tea",
		variations: JSON.stringify([
			{
				sku: "2019-menghai-shugar-ripe-puer-72g",
				price: 13.0,
				stock: 0,
				sort: 1,
				attributes: [
					{
						attributeId: "WEIGHT_G",
						value: "72",
					},
				],
			},
		]),
	},
	{
		name: `2019 Menghai "Clean Flavor" Ripe Pu'er`,
		slug: "2019-menghai-clean-flavor-ripe-puer",
		teaCategories: ["ripe-pu-er"],
		description: "Linked to blog post with the same slug",
		images:
			"products/ripe-puer-clean-flavor-2019-menghai-1.jpg, products/ripe-puer-clean-flavor-2019-menghai-2.jpg, products/ripe-puer-clean-flavor-2019-menghai-3.jpg",
		price: 0,
		isActive: true,
		isFeatured: true,
		discount: null,
		hasVariations: true,
		weight: "80",
		stock: 0,
		unlimitedStock: false,
		categorySlug: "tea",
		brandSlug: "podarki-vostoka",
		variations: JSON.stringify([
			{
				sku: "2019-menghai-clean-flavor-ripe-puer-8g",
				price: 3.0,
				stock: 0,
				sort: 1,
				attributes: [
					{
						attributeId: "WEIGHT_G",
						value: "8",
					},
				],
			},
		]),
	},
	{
		name: `Kun Lu Shan, Mengku, Lincang, Old Trees "Dao Shi" Ripe Pu'er`,
		slug: "kun-lu-shan-mengku-lincang-old-trees-dao-shi-ripe-puer",
		teaCategories: ["ripe-pu-er"],
		description: "Linked to blog post with the same slug",
		images:
			"products/shu-puer-dao-shi-mengku-kun-lu-shan-old-trees-1.jpg, products/shu-puer-dao-shi-mengku-kun-lu-shan-old-trees-2.jpg, products/shu-puer-dao-shi-mengku-kun-lu-shan-old-trees-3.jpg, products/shu-puer-dao-shi-mengku-kun-lu-shan-old-trees-4.jpg, products/shu-puer-dao-shi-mengku-kun-lu-shan-old-trees-5.jpg, products/shu-puer-dao-shi-mengku-kun-lu-shan-old-trees-6.jpg, products/shu-puer-dao-shi-mengku-kun-lu-shan-old-trees-7.jpg",
		price: 0,
		isActive: true,
		isFeatured: true,
		discount: null,
		hasVariations: true,
		weight: "100",
		stock: 0,
		unlimitedStock: false,
		categorySlug: "tea",
		brandSlug: "podarki-vostoka",
		variations: JSON.stringify([
			{
				sku: "kun-lu-shan-mengku-lincang-old-trees-dao-shi-ripe-puer-25g",
				price: 24.0,
				stock: 0,
				sort: 0,
				attributes: [
					{
						attributeId: "WEIGHT_G",
						value: "25",
					},
				],
			},
			{
				sku: "kun-lu-shan-mengku-lincang-old-trees-dao-shi-ripe-puer-50g",
				price: 46.0,
				stock: 0,
				sort: 1,
				attributes: [
					{
						attributeId: "WEIGHT_G",
						value: "50",
					},
				],
			},
			{
				sku: "kun-lu-shan-mengku-lincang-old-trees-dao-shi-ripe-puer-75g",
				price: 64.0,
				stock: 0,
				sort: 2,
				attributes: [
					{
						attributeId: "WEIGHT_G",
						value: "75",
					},
				],
			},
			{
				sku: "kun-lu-shan-mengku-lincang-old-trees-dao-shi-ripe-puer-100g",
				price: 84.0,
				stock: 0,
				sort: 3,
				attributes: [
					{
						attributeId: "WEIGHT_G",
						value: "100",
					},
				],
			},
		]),
	},
	{
		name: `2022 Ailao Shan, Menghai, Xishuangbanna, 70 year old trees, "Black Cat", Ripe Pu'er`,
		slug: "2022-ailao-shan-menghai-xishuangbanna-70-year-old-trees-black-cat-ripe-puer",
		description: "Linked to blog post with the same slug",
		images:
			"products/ripe-puer-black-cat-ailao-shan-70-year-old-trees-2022-1.jpg, products/ripe-puer-black-cat-ailao-shan-70-year-old-trees-2022-2.jpg, products/ripe-puer-black-cat-ailao-shan-70-year-old-trees-2022-3.jpg, products/ripe-puer-black-cat-ailao-shan-70-year-old-trees-2022-4.jpg, products/ripe-puer-black-cat-ailao-shan-70-year-old-trees-2022-5.jpg, products/ripe-puer-black-cat-ailao-shan-70-year-old-trees-2022-6.jpg, products/ripe-puer-black-cat-ailao-shan-70-year-old-trees-2022-7.jpg",
		price: 0,
		isActive: true,
		isFeatured: true,
		discount: null,
		hasVariations: true,
		weight: "100",
		stock: 0,
		unlimitedStock: false,
		categorySlug: "tea",
		brandSlug: "podarki-vostoka",
		variations: JSON.stringify([
			{
				sku: "2022-ailao-shan-menghai-xishuangbanna-70-year-old-trees-black-cat-ripe-puer-25g",
				price: 8.5,
				stock: 0,
				sort: 0,
				attributes: [
					{
						attributeId: "WEIGHT_G",
						value: "25",
					},
				],
			},
			{
				sku: "2022-ailao-shan-menghai-xishuangbanna-70-year-old-trees-black-cat-ripe-puer-50g",
				price: 17.0,
				stock: 0,
				sort: 1,
				attributes: [
					{
						attributeId: "WEIGHT_G",
						value: "50",
					},
				],
			},
			{
				sku: "2022-ailao-shan-menghai-xishuangbanna-70-year-old-trees-black-cat-ripe-puer-75g",
				price: 23.0,
				stock: 0,
				sort: 2,
				attributes: [
					{
						attributeId: "WEIGHT_G",
						value: "75",
					},
				],
			},
			{
				sku: "2022-ailao-shan-menghai-xishuangbanna-70-year-old-trees-black-cat-ripe-puer-100g",
				price: 30.0,
				stock: 0,
				sort: 3,
				attributes: [
					{
						attributeId: "WEIGHT_G",
						value: "100",
					},
				],
			},
		]),
	},
];

// Mock Blog Posts
export const mockBlogPosts = [
	{
		title: null,
		slug: "poker-ceremony",
		teaCategories: ["ripe-pu-er"],
		body: `
Yesterday, we got together with the guys to play poker. I wasn’t too keen on losing all my possessions 🥸, so I took responsibility for the tea — sticking to the basics 😎

After warming up with two introductory shu pu’ers, we moved on to the crown jewel—a **wild white tea** from **the oldest tea tree in the world**! This **2,800-year-old tree** grows in Thailand. The leaves were harvested in February 2023. In the aroma, we picked out hay, the sweetness of grape-flavored Skittles, white wine, lichen, and hints of citrus. The taste revealed marzipan, greater celandine, linden, and cherry pit.

Next, we decided to warm up with a red tea — **Zhen Shan Xiao Zhong**, smoked over pinewood, from the Tongmu nature reserve in Fujian Province. The aroma carried notes of salted bream, cervelat sausage, smoked string cheese, smoked paprika, pinene, the sweetness of baked red apples, halva, linden sauna whisks, and redwood. In the fairness cup, we picked up eucalyptus and the scent of a pinewood sauna. The taste featured a sour cherry jam tartness, nettle, wormwood, fruitwood chips, fig, and dried apricot. Upon swallowing, a lingering menthol coolness spread across the upper palate.

For dessert, we had a heavily fermented **Hong Shui oolong** (Grade A) from the spring 2016 harvest. The cultivar was Jin Xuan (TRES #12), grown in Thailand at an altitude of 1,300 meters. The dry leaf enticed with the aroma of chocolates filled with cognac ganache. The taste showcased pine cones—or rather, pine cone jam—linden honey licked off a wooden spoon, and the minty freshness of menthol.

To wrap things up, we finished with another Thai guest: **a well-aged 15-year-old sheng from 300-year-old trees** growing at 1,300 meters above sea level. Its organoleptic profile featured medicinal balm, the antique coziness of knitted socks, dried apricot, pear, and mangosteen peel. The infusion had a jelly-like texture.

We got extra tea-drunk and were chilling listening to [J Dilla’s beats](https://t.me/gong_fu_cha_vibrations/1056) until 4 AM, playing board games and having deep conversations. 🌸`,
		images: [
			"blog-images/poker-ceremony-1.jpg, blog-images/poker-ceremony-2.jpg, blog-images/poker-ceremony-3.jpg, blog-images/poker-ceremony-4.jpg,",
		],
		publishedAt: 1739768400,
		productSlug: null,
	},
	{
		title: null,
		slug: "gongting-red-horse-yong-de-2014",
		teaCategories: ["ripe-pu-er"],
		body: `
A warm, misty morning prompted me to brew an old gong ting… 🌫

**Gong Ting** (宫廷) is a type of raw material for shu pu’er, characterized by a high number of small buds and sometimes consisting entirely of them. It has a rich and straightforward taste, along with a pronounced invigorating effect. You may come across the words “palace” or “imperial” alongside the term “Gong Ting”—however, this is just a marketing trick designed to create an illusion of premium quality.

The term “imperial” refers to tribute tea, also known as “**Gong Cha**” (宫茶)—a tea that was regularly sent to the imperial court in China as tribute. The tradition of tribute tea dates back to 1066 BCE and mostly consisted of first spring harvest green teas. Shu pu’er was never a tribute tea, as it was only invented in the 1970s, and Gong Ting itself appeared even later, in the 1990s.

You may also find the “Gong Cha” prefix in the names of different teas, but these are just words used to attract buyers. They mean nothing, as the last empire (Qing) fell more than a century ago, and in modern China, no one pays tea tribute to anyone. So, Gong Cha is about a historical phenomenon, while Gong Ting refers to a specific type of raw material for shu pu’er.

###### Now, on to the review!

🌿 The raw material comes from Yong De County, Da Xue Shan region, Lincang Prefecture. Harvested in 2013, fermented, and pressed in 2014.

The pressing is of medium density, so it was easy to break off a piece into smaller fragments for better extraction.

**Aroma**: Ashy notes, deep tones of dark leather, a light spicy scent of gingerbread, spring kindling, and the sweetness of raisins, transitioning into fermented shades reminiscent of kombucha. An antique, old-world aroma that brings to mind the scent of a well-worn sheepskin coat from grandpa’s wardrobe.

**Taste**: A strict, buttery-olive old man! Almond liqueur infused with fresh cherry juice, a long-lasting and deeply penetrating astringency of 95% dark chocolate. Clearly pronounced sandy tones synergize with a camphor aftertaste, all without a trace of sweetness.

A fast, dense charge—and off to code! 💚

[Musical accompaniment](https://t.me/gong_fu_cha_vibrations/861)

Alexander 🔜 [@alexrublevsky](https://t.me/alexrublevsky)`,
		images: [
			"blog-images/gongting-red-horse-yong-de-2014-1.jpg, blog-images/gongting-red-horse-yong-de-2014-2.jpg, blog-images/gongting-red-horse-yong-de-2014-3.jpg, blog-images/gongting-red-horse-yong-de-2014-4.jpg",
		],
		publishedAt: 1741150800,
		productSlug: null,
	},
	{
		title: `Ripe Pu'er “Black Cat” 🐈‍⬛`,
		slug: "ripe-puer-black-cat",
		teaCategories: ["ripe-pu-er"],
		body: `
🌿 Harvested in 2022 from 70-year-old trees on Ai Lao Mountain, Pu’er Prefecture, Menghai County, Xishuangbanna. After a year of aging, it was pressed in September 2023.

###### Aroma
**Hot leaves:** a sweetish scent with notes of tree bark, hazelnut, subtle spice, and minerality.

**Wet leaves:** hematogen, milk chocolate with caramel, cocoa beans.

###### Taste
Full-bodied and oily, velvety, slightly metallic, creamy, and pastry-like. Pronounced sweetness, particularly toffee and powdered sugar.

###### Effect
Energizing, sharpens focus for a productive mindset.

A cat in a cup—this tea is all about a grin from ear to ear with the first sip, a rich extraction even with less leaf, and a first-class awakening from deep sleep. 🥱

Musical pairing — [Falling in Love with the cat](https://t.me/gong_fu_cha_vibrations/1034) 💃`,
		images: null,
		publishedAt: 1740373200,
		productSlug:
			"2022-ailao-shan-menghai-xishuangbanna-70-year-old-trees-black-cat-ripe-puer",
	},
	{
		title: `Raw Puer Impression 2021`,
		slug: "raw-puer-impression-2021",
		teaCategories: ["raw-pu-er"],
		body: `
How many cups have been drunk, how many moments filled with sweetness… Today, we finished a favorite—if not a legend—a deep, multi-layered sheng pu'er that fully lives up to its name: “**Impression**”.

🌿 A blend of spring and autumn 2021 harvest leaves from Mengku, Ban Dong, and Jinggu, stone-pressed using traditional techniques.

###### Aroma
**Hot leaves:** damp moss, the saltiness of a coastal breeze, the tartness of goji berries. Inhaling, you feel like a little snail crawling along a puddle’s edge. 🐌🌊

**Steamed leaves:** light floral honey, fern leaves, cucumber soda (Sprite), marjoram, burdock flower, lychee peel.

###### Taste
The minerality of moss-covered stone, wakame seaweed, meadow grasses, sage, and edamame. A hint of dill emerges in the aftertaste.

A moderately oily body, the drink glides effortlessly down the throat. After the fifth steeping, it unfolds into an ultimate sweetness: vanilla pod, sweet corn, condensed milk.

###### Effect
Smoothly relaxes the body while lending agility and fluidity to attention, adding a playful touch to perception.

With a tea like this, you want to listen to experimental ambient music, watch squirrels play in the garden—and in that observation, for a moment, become a squirrel yourself, because the observer is inseparable from the observed. 🐿

For all tea-related inquiries ➡️ [@alexrublevsky](https://t.me/alexrublevsky)`,
		images:
			"blog-images/sheng-puer-impression-2021-1.jpg, blog-images/sheng-puer-impression-2021-2.jpg, blog-images/sheng-puer-impression-2021-3.jpg, blog-images/sheng-puer-impression-2021-4.jpg, blog-images/sheng-puer-impression-2021-5.jpg",
		publishedAt: 1740027600,
		productSlug: null,
	},
	{
		title: `“Dao Shi” for the Soul — Confectionery Shu Pu'er 🧁`,
		slug: "kun-lu-shan-mengku-lincang-old-trees-dao-shi-ripe-puer",
		teaCategories: ["ripe-pu-er"],
		body: `
📍 A blend of tea leaves harvested from ancient trees in the imperial tea garden, located on Kun Lu Shan Mountain in the Mengku region, Lincang Prefecture.

🌿 The material was processed using a unique technology—fermentation in small-volume baskets.

###### Aroma
Creamy and nutty, poppy seed bun, fudge, raisins, strawberry jam, petrichor.

###### Taste
The flavor continues with a rich poppy seed bun, complemented by creaminess and date syrup. Nutty notes—hazelnut and toffee pecan—intertwine with a soft caramel undertone.

###### Effect
Cha Qi gently energizes and sharpens focus, carefully restoring a productive balance 🪨`,
		images: null,
		publishedAt: 1739725200,
		productSlug: "kun-lu-shan-mengku-lincang-old-trees-dao-shi-ripe-puer",
	},
	{
		title: `Purple Tea — What Is This Mystery?`,
		teaCategories: ["purple"],
		slug: "purple-tea-what-is-this-mystery",
		body: `
In previous posts, I’ve mentioned purple teas (*Zi Cha*) — now it’s time to dive deeper.

The purple color of the leaves is due to **anthocyanins** — flavonoid pigments that also give red, purple, pink, blue, and violet flowers and ripe fruits their color. These pigments are glycosides: their molecules consist of a non-sugar part (aglycone) and a sugar residue. Tea plants contain aglycones (anthocyanidins) such as pelargonidin, cyanidin, delphinidin, peonidin, malvidin, and others. Anthocyanins are present even in regular green-leaf cultivars, but only in trace amounts—about 0.01%, meaning the dominant green color from chlorophyll remains. In purple-leaf varieties, the concentration is 50–100 times higher (0.5–1%), giving them their characteristic hue. These pigments shift color depending on the type of anthocyanidin, the acidity of the cell sap, and the presence of metal ions such as iron, aluminum, magnesium, molybdenum, and tungsten. The final leaf color is influenced not only by anthocyanins but also by the ratio of chlorophyll a and b and the growing conditions.

Only about 1–2% of tea trees naturally produce purple leaves. 
They are more commonly found in wild-growing trees, which makes sense — over centuries, 
cultivated tea plantations primarily selected the standard green-leaf varieties. 
As a result, purple-leafed teas are most prevalent in Yunnan, where wild tea still 
plays a significant role in the tea industry. In most cases, the purple pigment 
appears in buds and the first 2–3 leaves, though in rare cases, entire trees can 
develop fully purple foliage, depending on terroir.

The synthesis of anthocyanins increases under stress factors—extreme temperatures, 
drought, and, most notably, ultraviolet radiation. This pigment acts as a natural 
sunscreen for the plant, partially compensating for the reduced chlorophyll production 
that occurs under intense sunlight. Growing altitude is key, as tea trees at high elevations 
receive up to eight times more UV radiation than those on lower plains.

Health Benefits of Purple Tea
Research indicates that anthocyanins have strong antioxidant properties. They are believed to aid in the treatment of skin diseases, help prevent diabetes, and support mucosal health. Additionally, some studies suggest that purple tea may be even more effective than regular tea in regulating high blood pressure.

Purple Tea’s Evolution
Until the late 20th century, purple tea leaves were not seen as anything special—they were either ignored or blended with green material in the production of sheng pu'er. It was only in the late 20th and early 21st centuries that purple tea began attracting interest as a separate category, with experimentation in its processing.

###### Three Types of Purple Tea Material
* **Zi Ya** (*Purple Buds*, 紫芽) – A natural mutation of tea trees. Due to its rarity, it tends to be more expensive.

* **Zi Juan** (*Purple Grace*, 紫娟) – A cultivar developed in the 1990s in Yunnan by crossing a Fujian purple variety with Yunnan assamica. The ancestor of this variety was a unique purple-leafed tree discovered in 1985 among 600,000 seedlings at the Yunnan Tea Research Institute plantation. Unlike the natural mutation of Zi Ya, this cultivar consistently produces purple-colored leaves on all growth. However, its taste often lacks complexity, resembling teas meant for mass production rather than wild or traditional varieties.

* **Zi Cha** (*Purple Tea*, 紫茶) – Tea made from *Zi Ya*. This category usually includes wild-growing (*Ye Sheng*, 野生) trees. *Zi Cha* is known for its enhanced oiliness in flavor.

How Does Purple Tea Look and Taste?
After compression, purple tea material darkens to an almost black shade, while its infusion takes on a golden-yellow hue. The flavor profile features less of the typical pu'er astringency, replaced by a distinct sweetness reminiscent of pomegranate peel or mangosteen. However, the sensory experience of purple tea is highly nuanced — it’s something that truly must be tasted firsthand!`,
		images: "blog-images/purple-tea-what-is-this-mystery.jpg",
		publishedAt: 1739376000,
		productSlug: null,
	},
	{
		title: `Wild Purple White Tea “Ye Sheng Ya Bao”`,
		slug: "wild-purple-white-tea-ye-sheng-ya-bao",
		teaCategories: ["purple", "white"],
		body: `
📍 Jinggu Dai and Yi Autonomous County, Pu’er City (formerly Simao), Yunnan Province

🌿 Buds (*Ya Bao*, 芽苞) from the wild (*Ye Sheng*, 野生) purple (*Zi Cha*, 紫茶) variation of the tea tree! The processing is extremely simple: light withering and hot-air drying to halt oxidation.

📆 Harvested from mid-February to early March 2024

Infusion color is Almost transparent, with a slight greenish tint.

Aroma 🍇
**Dry**: Bright grape bubblegum, cotton candy.

**Wet**: Lingonberry kissel.

**Gaiwan lid**: Loads of eucalyptus!

**Steamed**: Juniper berry, green gooseberry jam, and an abundance of eucalyptol combined with sweetness reminiscent of marjoram.

**Taste** 🍉
Green grapes, watermelon juice, juniper needles, blackcurrant leaf, thyme, a hint of cardamom, and a light pinch of lemon zest. Salivation (*Shengjin*, 生津) is at its peak—this tea is excellent at quenching thirst.

Been wanting to try this tea or learn something interesting about it? 🔜 [@alexrublevsky](https://t.me/alexrublevsky)`,
		images:
			"blog-images/wild-purple-white-tea-ye-sheng-ya-bao-1.jpg, blog-images/wild-purple-white-tea-ye-sheng-ya-bao-2.jpg, blog-images/wild-purple-white-tea-ye-sheng-ya-bao-3.jpg, blog-images/wild-purple-white-tea-ye-sheng-ya-bao-4.jpg, blog-images/wild-purple-white-tea-ye-sheng-ya-bao-5.jpg",
		publishedAt: 1739034000,
		productSlug: null,
	},
	{
		title: `Blue Tea "Anchan"`,
		slug: "blue-tea-anchan",
		body: `
Receiving a package from Thailand with a friend, we immediately sat down for a tasting.
The first thing that caught our eye was the most unusual item—blue tea. 
This is not the tea tree *Camellia sinensis*, which this blog is dedicated to, 
but an entirely different plant — *Clitoria ternatea*, commonly known as Butterfly Pea.
Native to tropical equatorial Asia, Clitoria ternatea is widely spread in Thailand, 
Nepal, and Myanmar, where an infusion of its dried flowers is called Anchan. 
However, the drink is also found in China and Tibet under the name *Chang Shu*.

The deep, inky-blue color of the infusion is due to the presence of anthocyanins in the flowers. When any acid, such as lemon juice, is added, the drink changes color to magenta.

###### Aroma
**Dried flower**: Pronounced prune in dark chocolate, a rich fruit reduction sauce for meat with Chinese spices.

**Hot flower**: Bulgogi! That exact meaty sauce in its deep, complex expression! 🍖

**Steamed flower**: A full-bodied aroma of quinoa.

###### Taste
The first sip—an instant look of confusion replaced by curiosity: crispy fried peas (from Indian snacks), salted peanuts, buckwheat with meat gravy, a hint of Smecta medicine, sunflower and flax seeds. 🫛

In the mouth, the drink feels not just oily but downright fatty—almost like eating fried peanuts with peas. 🥜

###### Health Benefits
There is scientific evidence suggesting that Clitoria ternatea has a positive effect on the nervous system: its extract may improve brain circulation, stimulate memory, and strengthen neurons (based on studies, mostly conducted on animals). There is also data on its potential ability to lower blood sugar levels and its pronounced antioxidant properties.

In traditional medicine, blue tea has been used for infertility, menstrual disorders, and sexual dysfunction, as well as a natural aphrodisiac. In Ayurvedic medicine, it is considered a remedy for asthma, bronchitis, tuberculosis, and migraines, although these effects have yet to receive sufficient scientific confirmation.

That’s the fascinating world of blue tea!`,
		images:
			"blog-images/blue-tea-anchan-1.jpg, blog-images/blue-tea-anchan-2.jpg, blog-images/blue-tea-anchan-3.jpg, blog-images/blue-tea-anchan-4.jpg",
		publishedAt: 1738774800,
		productSlug: null,
	},
	{
		title: `🌳 Ceremony: “Introduction to Chinese Tea”`,
		slug: "ceremony-introduction-to-chinese-tea",
		body: `
A gathering for beginners on the tea journey: we will develop a broad visual and sensory experience through the tasting of a wide range of tea categories. You’ll get plenty of educational insights and will undoubtedly discover something new!

You will experience:
🍃 **Shu Pu'er** from ancient trees of Kuchzhushan Mountain, Jinggu County. Hand-fermented in small-volume baskets.

🍃 **Sheng Pu'er** (2022 harvest) from the depths of the Xishuangbanna mountains, from the Yule ethnic village.

🍃 **Old Purple Sheng Pu'er** from the 2007 spring harvest in Jinggu. Aged for over 7 years in subtropical conditions.

🍃 **Red Tea** Zheng Shan Xiao Zhong smoked over pinewood, from Fujian Province, Tongmu Nature Reserve.

🍃 **White Tea** from Kunlushan Mountain. Spring harvest from 60-year-old straight-trunk tea trees (Qiao Mu) in the Imperial Tea Garden of Huang Jia.

👥 Spots available: 5

💰 Contribution: $10 pre-paid or $15 on the day of the event

❣️ Important ❣️

Have a full meal at least an hour before the gathering and refrain from smoking.

📍 Location:

127 Howard Ave, Hamilton

Sign up for the ceremony 🔜 [@alexrublevsky](https://t.me/alexrublevsky)`,
		images: "blog-images/ceremony-introduction-to-chinese-tea.jpg",
		publishedAt: 1738170000,
		productSlug: null,
	},
	{
		title: `Ripe Pu'er "Clean Flavor" 2019 Menghai`,
		slug: "ripe-puer-clean-flavor-2019-menghai",
		teaCategories: ["ripe-pu-er"],
		body: `
📍 Tea Plantations in Menghai County.

📆 Harvest of 2019. The finished tea underwent extended aging in a Menghai warehouse under dry storage conditions.

The 8-gram "mini bing" format is convenient for storage, transportation, and use. The tea is tightly pressed, so I recommend letting it soak and expand before brewing.

**Aroma**: seaweed, coastal stone, spicy, redwood.

**Taste**: iodine-like, buttery, cappuccino, dark brown sugar, damp log, and chocolate.

A soft, dense infusion.

[Music for good vibes 🎵](https://t.me/gong_fu_cha_vibrations/562)

And I’m off to the gym to put this energy to use! Wishing everyone mindful processes 🔘`,
		images: "",
		publishedAt: 1738083600, // 2025-01-28
		productSlug: "2019-menghai-clean-flavor-ripe-puer",
	},
	{
		title: "Key Characteristics of High-Quality Tea 🌳",
		slug: "key-characteristics-of-high-quality-tea",
		body: `
Embarking on the tea path reveals the importance of accurately evaluating the characteristics of high-quality tea. Descriptions alone are often insufficient—one must develop knowledge through personal experience to confirm or refute the qualities of good tea as defined by other tea masters. Both the brewing method and the quality of the tea significantly influence the characteristics listed below—well-brewed tea demonstrates these qualities much more clearly than poorly prepared tea. Thus, honing the art of brewing, selecting the right teaware, and paying attention to details are crucial. So, let’s begin…

A good tea immediately rises to the upper palate, naturally and evenly reaching the back of the throat. You can feel it equally in all parts of the throat, wherever you direct your attention. This is a very important characteristic, as even beginners can instantly notice the difference.

Tea should have a lasting aroma that gradually rises through the throat and into the nasal cavity. Low-quality aromas always “sit” on the outer surface of the face and disappear quickly. In contrast, the aroma of good tea can linger in the nose even after several cups.

###### ⚪️ *Hui Gan* (回甘) — Returning Sweetness
High-quality tea should transition smoothly, quickly, and harmoniously through five flavor stages: bitterness, sharpness, “gan,” sourness, and sweetness. The third stage, “gan,” is more of a sensation than a flavor. It is akin to the freshness of mint or the crispness of winter air. The word “hui” means “return,” so the entire term refers to a transformation of sensations: a clean bitterness at the back of the throat gradually gives way to a fresh, minty sweetness, which intensifies with each breath and becomes the dominant sensation. The strength and persistence of returning sweetness are important criteria for evaluating the quality of tea leaves.

###### 🟡 *Sheng Jin* (生津) — Saliva Secretion
This is the process of saliva secretion from the cheeks, tongue surface, and underside of the tongue after drinking tea. It should occur naturally, without strain. During tea tasting, the first sip and the sensations during and after it are critical. Some tea components create an astringent or dry feeling in the mouth, which then transforms into moistness. However, not all astringency is accompanied by this sensation; some teas cause intense dryness and stickiness in the mouth, like the feeling of unripe persimmon. Naturally, such tea is difficult to consider good.

###### 🟠 *Hou Yun* (“hou” — throat, “yun” — rhyme, 喉韵) — Throat Melody
This is the sensation that arises in the upper part of the throat after a sip of tea. It is often perceived as a pleasant sweetness and freshness. Hou Yun is associated with the depth and fullness of a tea’s flavor.

Different types of tea exhibit Hou Yun to varying degrees, with Sheng Pu'er and Wuyi rock oolongs having the most distinct and vibrant expressions. The strength and duration depend on the quality of the raw material and its mineral richness. Hou Yun may be faint or absent in those accustomed to smoking.

Unpleasant sensations in the throat are a clear sign of poor tea quality or careless preparation. “Smoothness” is the key word for good tea. It should feel silky and soft. For this reason, high-quality tea quenches thirst effectively.

###### 🔴 *Ti Gan* (体感) — Bodily Perception
The physical sensations experienced in the body after drinking tea reflect the biological activity of the tea infusion. These sensations do not always directly indicate the quality of the tea, as they are a subjective reaction influenced by the individual’s physical condition and the tea’s brewing conditions.

###### 🟣 *Cha Qi* (茶气) — Energy/Strength
This strength can be described as the tea’s ability to alter the drinker’s perception through its consumption. It is sometimes referred to as “psychedelic,” “energetic,” or characterized by other qualities. However, it is essential to understand that this is not the sensation itself but the tea’s capacity to create such states. It describes the potential of tea to shape a unique experience for the drinker.

This phenomenon is more familiar to seasoned tea enthusiasts and is directly related to the number of mindful tea practices one has engaged in, as well as one’s exposure to “good teas”.`,
		images: null,
		publishedAt: 1737907200, // 2025-01-27
		productSlug: null,
	},
	{
		title: `Everyday Folk Classic — Ripe Pu'er ‘Shugar’ 🍦`,
		slug: "everyday-folk-classic-ripe-puer-shugar",
		body: `
📍 Harvest and Fermentation: 2019 and 2020; pressed in 2022 in Menghai County, Xishuangbanna Prefecture, Yunnan Province.

🌿 The base of this tea is grade 3 whole leaves, generously complemented by delicate grade 1 buds. Moderate fermentation, paired with three years of pre-aging, turns this blend into a genuine treat!

The tea is pressed into a dense brick form, so be sure to give each segment enough time to expand fully in the water before brewing to unlock its full potential.

###### Aroma
Freshly churned homemade ice cream, warm cinnamon buns, linden wood, and a subtle hint of cranberries.

###### Taste
Dark chocolate, caramelized sugar, woody notes, airy whipped cream, pine cones, cilantro stems, and a touch of tangy vitamin C. The finish offers a delicate ashiness and a rich, lingering cocoa aftertaste.

Energizes and sharpens focus 👁

For such sweetness, the right music is a must — [bringing the heat from the early morning](https://t.me/gong_fu_cha_vibrations/128)!`,
		images: "",
		publishedAt: 1737129600, // 2025-01-17
		productSlug: "2019-menghai-shugar-ripe-puer",
	},
	{
		title: `Raw Pu'er Ku Zhu Shan x Kun Lu Shan "Aurora Borealis"`,
		slug: "raw-puer-ku-zhu-shan-x-kun-lu-shan-aurora-borealis",
		teaCategories: ["raw-pu-er"],
		body: `After yesterday’s cozy eight-hour tea gathering, I’m easing back into the daily rhythm with the soft, nuanced, and colorful sheng pu'er, “Northern Lights” 🧿

📍This blend is crafted from the iconic mountains of Ku Zhu Shan and Kun Lu Shan, located in Jinggu County. 

🌿 Ku Zhu Shan is known for its ancient rattan trees, named after their unique shoots that transform into long, winding tendrils. This is linked to the harvesting method, where the entire leaf is picked except for the final ones on the branch.

The aroma of the warmed leaves reveals notes of orchid, petrichor, dry moss, and a faint ocean breeze. As the leaves are steamed, hints of citronella, barberry, sage, and a pinch of lemon zest emerge.

The first sip unfolds flavors of Granny Smith apple, green gooseberry, and lemon tart with a flaky crust. The aftertaste is graced by cooling notes of mint and pine.

As expected of top-shelf shengs, the later infusions bloom with a deep vanilla sweetness, a reminder that the best flavors await at the very end.`,
		images: "",
		publishedAt: 1736784000, // 2025-01-13
		productSlug: "ku-zhu-shan-x-kun-lu-shan-aurora-borealis-raw-puer",
	},
	{
		title: "Classification of Chinese Tea",
		slug: "classification-of-chinese-tea",
		body: `
Chinese tea can be categorized into six main types based on the processing method and degree of oxidation or fermentation:

###### ⚪ White (*Bai Cha*, 白茶)
White tea is made from the youngest, half-opened leaves of the first harvest, covered with short white hairs on the buds (called bai hao, or “white tips” — trichomes). It has the simplest processing method among all tea types: the leaves are harvested, naturally withered, and sun-dried. Oxidation in white tea is minimal.

###### 🟢 Green (*Lü Cha*, 绿茶)
After harvesting, the leaves are slightly withered in the open air. Oxidation is halted by roasting the leaves in heated woks or over an open flame. The leaves are then dried and, depending on the variety, rolled or twisted into various shapes. Oxidation levels are extremely low, around 1–2%.

###### 🟡 Yellow (*Huang Cha*, 黄茶)
Yellow tea is one of the rarest tea types. The leaves are heated over charcoal, then wrapped in parchment, where a slow oxidation process called *menhuang* (“sealing yellow”) occurs, giving the tea its yellowish hue. This process can take up to 72 hours.

###### 🟣 Oolong (乌龙)
With a medium oxidation level ranging from 40% to 60%, oolong tea is often made from mature leaves of older tea bushes. After harvesting, the leaves are withered in the sun for 30–60 minutes, then placed in bamboo baskets and left in the shade. The leaves are periodically shaken and gently bruised to oxidize the edges while keeping the central veins green. Oxidation is halted through roasting in hot air, followed by rolling and final drying. The entire process takes 2–3 days.

###### 🔴 Red (*Hong Cha*, 红茶)
Known as “red tea” in China due to its infusion color, but historically referred to as “black tea” internationally, this tea involves the following steps: harvesting → withering → rolling to release tea juices → shaping. For certain varieties, such as Zheng Shan Xiao Zhong, the leaves are heated over wood before rolling. Oxidation occurs in covered boxes to enhance flavor development, after which the tea is dried and sorted.

###### ⚫ Black (*Hei Cha*, 黑茶)
Classified as “black tea” in China but referred to elsewhere as “dark” or “post-fermented” tea, this type uses mature, robust leaves, including coarse leaves and stems.

Harvesting → wilting under the sun → pan-frying on a dry wok (*sha qing*, or “kill-green”) → rolling to release juices → piling the leaves into small heaps and covering them with cloth for microbial fermentation over several days.

The tea is then placed in baskets and warmed over charcoal to halt fermentation. It is later pressed into bricks and dried.

The term “post-fermented” highlights the defining feature of this tea: secondary fermentation. Black tea continues to mature and develop its flavor over time, provided it is stored properly. It is considered “alive,” gaining depth and complexity with age.

Black tea originated in the late 1300s during the Ming dynasty and is 
still produced today in various provinces, especially near China’s 
western borders, where it is also known as “border tea.” The most 
famous example of *hei cha* is *Shu Pu’er*, though it is the youngest, 
having emerged in the 1970s.

##### ☝️ Beyond Six Types
While there are six main types of tea, each category contains subtypes 
defined by factors such as region, cultivar, and processing methods. 
For instance, the majestic…

###### ☯️ Pu’er (普洱)
Pu’er is a category of post-fermented tea characterized by the use 
of large-leaf tea tree varieties from Yunnan province and a unique 
processing method:

Harvest → kill-green (*sha qing*, at moderate temperatures) → rolling → sun-drying

This process produces raw material known as *mao cha*, which can be 
pressed into “raw” **Sheng Pu’er** cakes. Alternatively, it can undergo 
an additional wet-piling (*wo dui*, 渥堆) step: the leaves are piled 
in covered areas and moistened to promote microbial activity and 
controlled fermentation, lasting up to three months. Afterward, 
the tea is pressed into cakes and becomes known as **Shu Pu’er**.

Thanks to gentle thermal processing and the rich composition of 
large-leaf tea trees, Pu’er creates a unique environment for 
microorganisms, making it one of the most dynamic and "alive" 
post-fermented teas. This is particularly evident in *Sheng Pu’er*, 
where aging continues for decades, revealing new layers of flavor 
and aroma over time.`,
		images: null,
		publishedAt: 1736571600,
		productSlug: null,
	},
	{
		title: "Ma Wei Shan Gong Ting Ripe Pu'er 2018",
		slug: "ma-wei-shan-gong-ting-ripe-puer-2018",
		body: `
📍 The summit of Ma Wei Mountain (1300–1350 meters above sea level), located 
just west of Pu’er City in Simao, Yunnan.

📆 The tea was harvested in April 2018. After sun-drying (turning it into mao cha), 
it underwent a wet piling process (wu dui) lasting 45 days during the summer of the same year.

🌿 The leaves and buds were harvested from organically grown *Assamica* cultivar plants.

The aroma reveals notes of glazed curd bar with blueberries, 
roasted coffee beans, sweet milk corn, the minerality of seashells, and worn leather.

In the cha hai, a dense, hot chocolate aroma unfolds.

The taste embraces you with freshly baked brownies rich in dark 
chocolate and ripe blueberries, alongside salted caramel, light 
coffee with milk, and a delicate hint of prunes. The texture of 
cocoa is also noticeable.

The aftertaste carries a subtle ashiness, the sweetness of goji 
berries, and a faint note of dry hay.

The liquor is thick, oily, and smooth, coating every part of 
the mouth with its enveloping sweetness.

A tea with a very powerful energy (*cha qi*)! It focuses, 
energizes, and sends you into action!`,
		images: null,
		publishedAt: 1736312400,
		productSlug: "2018-ma-wei-shan-gong-ting-ripe-puer",
	},
	{
		title: "What is Gong Fu Cha?",
		slug: "what-is-gong-fu-cha",
		body: `
In Chinese, “Kung Fu Cha” (功夫茶), or “Gong Fu Tea” in English, refers to the process of preparing tea through a series of short steepings. This method maximizes the potential of the tea leaves, gradually revealing their flavor and aroma. The term “Kung Fu” in Chinese encompasses various meanings, including hard work, dedication, and skill. Thus, “Kung Fu Cha” can be translated as “the art of tea.”

###### The process involves the use of specific tools, though it is not limited to them:
* **Gaiwan** (“lidded bowl.” Literally: “gai” 盖 – lid, “wan” 碗 – bowl) — a vessel for brewing tea, consisting of three parts: a bowl, a lid, and a saucer. The Chinese characters “盖” (gài) mean “lid,” and “碗” (wǎn) mean “bowl.”
* **Cha Hai** (茶海 – “sea of tea”, also known as Gundaobei 公道杯 – “cup of fairness”, or simply a pitcher), ensures even distribution of tea among cups. By using it, each cup receives tea of the same strength and flavor, unlike pouring directly from the gaiwan, which might lead to uneven brews.
* **Cha He** (茶荷 – “tea box”) — a dish used for examining the dry tea leaves. It allows participants to appreciate the appearance and aroma of the tea. The Cha He is held close to the face with both hands, warmed by breath, and then the aroma is inhaled.
* **Cha Ban**, or tea tray, serves as a surface for arranging the tea utensils. It typically has a double bottom to collect any spilled water or tea.
* **Teacup** — a vessel for drinking tea. The shape and material can vary greatly, influencing the sensory experience of the tea.
* **Strainer** (茶滤 – Cha Lü) — used when pouring tea from the gaiwan into the Cha Hai to catch any stray leaves.

Tea drinking is a fluid process with a singular goal: to enjoy tea, rather than to stage a performance with arbitrary accessories. Each tool has its place as long as it serves a functional purpose.

For instance, if you are brewing tea alone with a small gaiwan, there is no need for a Cha Hai, as there’s no tea to share among multiple cups. Similarly, when using large, whole leaves, you might skip the strainer. At times, a simple towel can replace a tea tray. These details become apparent with experience, as you adapt the setting to your needs.

###### Key Tips for Brewing:
* **Preheat the gaiwan** with boiling water before adding the tea leaves. This step warms the vessel, greatly enhancing the tea’s aroma. Observing the progression of the leaves’ scent in their dry, heated, wet, and steamed states is fascinating.
* **Rinse the leaves** before the first brew (this is called the “zero infusion”). Tea production is not a sterile process, and no one wants to drink tea dust! Use the same water you used to preheat the gaiwan for this step.
* **Pour water in a circular motion** around the gaiwan rather than directly onto the leaves. This prevents unwanted bitterness. However, this variable invites experimentation. For some teas, pouring water directly onto the leaves enhances body, deepens aroma, and sharpens contrast between infusions, though it may result in a slightly shorter session.

Every type of tea is unique, requiring a specific approach for optimal enjoyment. As you progress along the tea path (Cha Dao), you begin to notice the variables to adapt for each tea. These include the amount of tea used, water temperature, soaking duration (for compressed teas), infusion time, and the material of your teaware. You’ll also observe how certain teas reveal themselves differently in varying brewing progressions and withstand different numbers of infusions.

While Cha Dao is rich in nuances, there’s no need to grasp everything at once. Simply focus on one cup at a time. 🍵`,
		images: null,
		publishedAt: 1735966800,
		productSlug: null,
	},
	{
		title: null,
		slug: "fresh-cycle",
		body: `
📦 A fresh cycle begins with the arrival of a 10 kg tea package, promising a year rich in flavor, energy, and, above all, the unifying warmth of a shared tea experience.

🎄 May this season bring you joy in the restoration of cosmic harmony in the present moment, and in the revival of the primordial ‘pure’ time, the sacred essence that existed at the dawn of creation.`,
		images: null,
		publishedAt: 1735707600,
		productSlug: null,
	},
	{
		title: "Zheng Shan Xiao Zhong",
		slug: "zheng-shan-xiao-zhong",
		body: `Yesterday, we tried a couple of interesting teas with the guys 🌟 
    
One of them was **Zheng Shan Xiao Zhong** (正山小种) "sweet potato". It is classified as a red tea (which we call black tea in the West).

Late-April harvest from the Wu Yi Mountains area (elevation 500–550 meters) in the northern part of Fujian Province.

###### History

The name of the tea translates to "tea from the right mountains", 
which relates to the period after the Opium Wars in the early 20th 
century. External capital flowed into China, intensifying competition, 
including in the tea industry. Many new types of tea appeared, including 
red teas that were not authentic Xiao Zhong. To protect the trademark 
and quality, the real Xiao Zhong was called *Zheng Shan*, meaning "true", 
while teas similar to it, harvested from surrounding mountains, were 
called *Wai Shan Cha* (外山茶), meaning "tea from the outer mountains".

It's worth noting that in today's Chinese tea market, the issue of 
substituting real Xiao Zhong with a similar tea from 'outer mountains' 
remains unchanged. This can be said about almost any quality material.

This tea is the #1 red tea in China and the oldest variety of Chinese tea overall!

###### Methodology

When preparing Xiao Zhong, the tea leaves are smoked over pine needles or wood, which is the main reason for the rich and distinctive aroma of this tea. The pine trees grow alongside the tea in Wu Yi Shan, Fujian Province.

###### Organoleptics 🐽

The dry leaves mesmerize with a bright aroma of coffee beans and the pastry "sweet potato." When warmed, it releases a dark hot chocolate, rye bread, and a wealth of sweet raisin notes like those found in Easter cake. In the wet leaves, the rye aroma intensifies, and the raisins take on a slightly fermented quality, like in kvass. After steaming, delicate baked notes and an oyster shell mineral quality emerge.

The taste carries all the above descriptors, with rye bread and a generous amount of raisins standing out the most.`,
		images:
			"blog-images/sweet-potato-zheng-shan-xiao-zhong-black-tea-spring-2024-1.jpg, blog-images/sweet-potato-zheng-shan-xiao-zhong-black-tea-spring-2024-2.jpg",
		publishedAt: 1735059600,
		productSlug: null,
	},
	{
		title: "Healing Dragon 🐉",
		slug: "healing-dragon",
		body: `📍A blend of material from the Mengku and Menghai regions

📆 Harvested in 2024

🥝 **Dry leaf aroma:** unfolds with notes of Belgian waffles with honey, 
blackberry, ripe golden kiwi, and damp moss.  **Wet leaf aroma:** reveal 
a comforting profile of anise and galangal, the sweetness of clove, 
chocolate mint, a light touch of chocolate pudding, and cinnamon.

🫚 The flavor carries forward the balanced herbal-medicinal tartness 
of **galangal**, complemented by rosehip, the rich spice of **clove**, 
**cardamom**, and the tang of blackcurrant leaf infusion. Sweet notes 
of honeysuckle harmonize with the richness of pine cone jam and a 
pinch of burnt sugar. **Together, it resembles a concoction of 
Thai herbs and roots with a whisper of lemongrass in the background**. 
The infusion feels velvety, deeply warming, and brimming with mineral complexity.

♨️ An ideal companion for snug winter days at home — 
a delightful antidote to the winter blues!`,
		images: "",
		publishedAt: 1735362000,
		productSlug: "2024-mengku-x-menghai-ripe-puer",
	},
	{
		title: "Wild Tree Purple Moonlight White Tea from Jinggu",
		slug: "wild-tree-purple-moonlight-white-tea-from-jinggu",
		teaCategories: ["purple", "white"],
		body: `
Another tea we tried recently with was **Yue Guang Bai** (*White Moonlight*), 
made from **wild purple tea trees** (*ye sheng cha*) of the *Camellia assamica dehongensis* subspecies.

📍 Hong Ni Tang Village mountainous area in Jing Gu County of Simao

📆 Harvest – April 2024

🌿 1:1 ratio of leaf to bud

The processing method for this tea is identical to the one used for 
the [rabbit tea](blog#white-bunny-the-hopper) I mentioned in a couple of posts above, but the different 
location of the source material creates an entirely different beverage.

###### Aromatics 🍇

The aroma is reminiscent of the Japanese chewy candy ‘Hi-Chew’ with 
purple grapes. The warmed leaves develop rich marzipan notes, 
complemented by a whole field of lavender.

###### Taste 🌸

From the first sip, the tea stimulates the salivary glands: chrysanthemum, 
dark grape pulp, a tang of red currant, floral perfume, and a light iris note.

A perfect choice for sweet tooths! 🍬`,
		images:
			"blog-images/wild-tree-purple-moonlight-white-tea-from-jinggu-1.jpg, blog-images/wild-tree-purple-moonlight-white-tea-from-jinggu-2.jpg",
		publishedAt: 1735059660,
		productSlug: null,
	},
	{
		title: "White Bunny, the Hopper! 🐇",
		slug: "white-bunny-the-hopper",
		teaCategories: ["purple", "white"],
		body: `
This white tea is crafted from material harvested in a 1:1 
ratio (leaf and bud) from wild purple tea trees (*ye sheng cha*) 
growing in the Mangshi County, Dehong Prefecture. The harvest 
took place in April 2023.

The leaves are processed using the *ye guang bai* methodology: the raw 
material is slightly wilted and then placed in a long tunnel with 
air circulation, where the oxidation process gradually halts.

###### What's this bunny like? 🐰

The dry leaves greet you with sweet notes of green gooseberry, 
hematogen, and lingonberry. But once steamed, they unveil bright 
aromas of**chocolate candy with hazelnut**, **white currants**, and 
top notes of birch twigs and cinnamon.

The taste combines the tartness of currant leaves with the tang of 
pineapple rind and the sweetness of cane juice. In the mouth, the 
tea feels quenching, mineral, and hydrating, like a sip of coconut 
water enhanced with the creamy richness of coconut pulp. The aftertaste 
distinctly reveals marzipan and the sweetness of macadamia nuts. With 
subsequent infusions, flavors of candied lime zest, Golden Delicious 
apples, lemongrass, and yellow dandelion flowers emerge.

The effect (*cha qi*) is meditative yet energizing, inspiring movement and creativity.`,
		images: null,
		publishedAt: 1734757200,
		productSlug: "2023-purple-yue-guang-bai",
	},
	{
		title: "Lincang Arbor Gong Ting Ripe Pu'er 2009 Spring",
		slug: "lincang-arbor-gong-ting-ripe-puer-2009",
		body: `Today's spotlight is on the 2009 spring harvest Gong Ting from Lincang Arbor, pressed in 2011. 🍃

The warmed leaf transports to an old farm hayloft with a faint note of manure in the distance. The steamed leaf in the top notes envelops aromas of rawhide, rye bread and rich iodine. The lower notes reveal baked apples, Westphalian bread, walnuts and varnished wood reminiscent of country house furniture.

On the palate, oak bark and a slight bitterness of apple pith come to the fore, complemented by a spicy cinnamon accent. The complete absence of sweetness emphasizes the austerity and character of the drink. The mouthfeel is reminiscent of the texture of natural cocoa powder, harmonizing with a slight butteriness, but without any pronounced drinkability.

Gunthinchik classically gives off an ultra-fast leaf extraction, but this copy surprises with its armor-piercing resistance to spills! 🦣`,
		images: null,
		publishedAt: 1734498000,
		productSlug: "2009-spring-lincang-arbor-gong-ting-ripe-puer",
	},

	{
		title: 'Ripe Pu\'er Ku Zhu Shan "Guardian 2.0"',
		slug: "guardian-2",
		body: `📍Ancient trees from Ku Zhu Shan Mountain, Jinggu County. 
    
🌿Fermentation was carried out in small-volume baskets. 
    
###### Aroma
 
Creamy and nutty, with confectionery notes: burnt brownie crust, condensed
milk, chocolate sponge cake, and a hint of vanilla pod. 
    
###### Taste
Grainy sweetness reminiscent of a "Kinder Country" bar, Neapolitan vanilla 
wafers, the astringency of grape seeds, a coppery tang, and the distinct 
flavor of Brazil nuts. The infusion is deep, smooth, and oily in texture. 
    
*Hui Gan* (*returning sweetness*, 回甘) is pronounced — the tea starts 
fresh and sweet with a clean bitterness. The aftertaste lingers and 
evolves gradually: the bitterness recedes, the sweetness intensifies, 
and ultimately, the sweetness prevails over bitterness. 
    
###### Effect
Focuses attention, gathers the mind, and energizes the body — 
a perfect balance! 

[Some deeply immersive ambient](https://t.me/gong_fu_cha_vibrations/862) 
for an attentive and meditative tea ritual ☯️`,
		images: "",
		publishedAt: 1737435600,
		productSlug: "ku-zhu-shan-guardian-20-ripe-puer",
	},

	{
		title: "Greetings!",
		slug: "greetings",
		body: `My name is Alexander, but my friends call me gaiwan 🦣

The purpose of this blog is to share the diverse manifestations of Chinese tea, as well as an educational base for an in-depth understanding of it.

I discovered the tea world in 2021, and began conducting ceremonies this year.

I was hooked by the phenomenon's limitless spectrum of flavors and aromas, where the final product is shaped by a myriad of variables. Among them: the location and altitude of the Camellia sinensis (tea tree), its age, cultivar, season, year and batch of harvest, as well as the choice of the part of the plant: leaf, bud or cuttings. Equally important is the processing of the raw material: every tiny detail, from the roasting temperature to the type of fermentation, forms the unique categories of Chinese tea, each of which would take more than a lifetime to study....`,
		images: "me.jpg",
		publishedAt: 1702857600, // 2024-12-18
		productSlug: null,
	},
];
