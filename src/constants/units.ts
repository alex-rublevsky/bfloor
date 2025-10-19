// Hardcoded constants for the application

// Единицы измерения для товаров
export const UNITS_OF_MEASUREMENT = [
	"погонный метр",
	"квадратный метр",
	"литр",
	"штука",
	"упаковка",
] as const;

export type UnitOfMeasurement = (typeof UNITS_OF_MEASUREMENT)[number];

// Страны для брендов - только те, которые реально используются
export const BRAND_COUNTRIES = ["NONE", "RU", "DE", "IT", "FR", "ES", "OTHER"] as const;
export type BrandCountryCode = (typeof BRAND_COUNTRIES)[number];

export const getBrandCountryName = (code: string | undefined | null): string => {
	switch (code) {
		case "RU":
			return "🇷🇺 Россия";
		case "DE":
			return "🇩🇪 Германия";
		case "IT":
			return "🇮🇹 Италия";
		case "FR":
			return "🇫🇷 Франция";
		case "ES":
			return "🇪🇸 Испания";
		case "CH":
			return "🇨🇳 Китай";
		case "OTHER":
			return "Другое";
		default:
			return "Не указано";
	}
};

// Теги для товаров - категоризация по назначению
export const PRODUCT_TAGS = [
	"kitchen", // Кухня
	"living-room", // Гостиная
	"bedroom", // Спальня
	"bathroom", // Ванная
	"hallway", // Прихожая
	"balcony", // Балкон
	"commercial", // Коммерческие помещения
	"outdoor", // Уличное использование
	"waterproof", // Водостойкие
] as const;

export type ProductTag = (typeof PRODUCT_TAGS)[number];

export const getProductTagName = (tag: string): string => {
	switch (tag) {
		case "kitchen":
			return "🍳 Кухня";
		case "living-room":
			return "🛋️ Гостиная";
		case "bedroom":
			return "🛏️ Спальня";
		case "bathroom":
			return "🚿 Ванная";
		case "hallway":
			return "🚪 Прихожая";
		case "balcony":
			return "🌿 Балкон";
		case "commercial":
			return "🏢 Коммерческие помещения";
		case "outdoor":
			return "🌳 Уличное использование";
		case "waterproof":
			return "💧 Водостойкие";
		default:
			return tag;
	}
};
