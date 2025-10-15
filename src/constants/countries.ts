// Simplest possible structure: a fixed set of codes and two tiny helpers.
export const SHIPPING_COUNTRIES = ["NONE", "CA", "RU", "CA_OR_RU"] as const;
export type ShippingCountryCode = (typeof SHIPPING_COUNTRIES)[number];

export const getCountryName = (code: string | undefined | null): string => {
	switch (code) {
		case "CA":
			return "Canada";
		case "RU":
			return "Russia";
		case "CA_OR_RU":
			return "Canada or Russia";
		default:
			return "Not specified";
	}
};

export const getCountryFlag = (code: string | undefined | null): string => {
	switch (code) {
		case "CA":
			return "🇨🇦";
		case "RU":
			return "🇷🇺";
		case "CA_OR_RU":
			return "🇨🇦 🇷🇺";
		default:
			return "";
	}
};
