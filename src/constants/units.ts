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
