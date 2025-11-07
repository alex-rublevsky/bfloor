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

// Теги для товаров - категоризация по назначению
// Только теги, которые реально используются в базе данных
export const PRODUCT_TAGS = [
	"kitchen", // Кухня
	"living-room", // Гостиная
	"bedroom", // Спальня
	"commercial", // Коммерческие помещения
	"outdoor", // Уличное использование
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
		case "commercial":
			return "🏢 Коммерческие помещения";
		case "outdoor":
			return "🌳 Уличное использование";
		default:
			return tag;
	}
};
