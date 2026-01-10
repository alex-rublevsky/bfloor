// ============================================================================
// HARDCODED COUNTRIES DATA
// ============================================================================
// Countries rarely change, so hardcoding them eliminates database queries
// and works perfectly with Vercel's serverless architecture.
//
// Benefits:
// - Zero database queries
// - Instant access (no network latency)
// - Works on all cold starts
// - Perfect for serverless
//
// Update this file when countries change (rare - maybe once a year)
// ============================================================================

export const COUNTRIES = [
	{
		id: 51,
		name: "Россия",
		code: "RU",
		flagImage: "/flags/ru.svg",
		isActive: true,
	},
	{
		id: 82,
		name: "Германия",
		code: "DE",
		flagImage: "/flags/de.svg",
		isActive: true,
	},
	{
		id: 117,
		name: "Италия",
		code: "IT",
		flagImage: "/flags/it.svg",
		isActive: true,
	},
	{
		id: 125,
		name: "Швейцария",
		code: "CH",
		flagImage: "/flags/ch.svg",
		isActive: true,
	},
	{
		id: 133,
		name: "Финляндия",
		code: "FI",
		flagImage: "/flags/fi.svg",
		isActive: true,
	},
	{
		id: 147,
		name: "Австрия",
		code: "AT",
		flagImage: "/flags/at.svg",
		isActive: true,
	},
	{
		id: 148,
		name: "Португалия",
		code: "PT",
		flagImage: "/flags/pt.svg",
		isActive: true,
	},
	{
		id: 154,
		name: "Китай",
		code: "CN",
		flagImage: "/flags/cn.svg",
		isActive: true,
	},
	{
		id: 234,
		name: "Польша",
		code: "PL",
		flagImage: "/flags/pl.svg",
		isActive: true,
	},
	{
		id: 239,
		name: "Бельгия",
		code: "BE",
		flagImage: "/flags/be.svg",
		isActive: true,
	},
	{
		id: 241,
		name: "Сербия",
		code: "RS",
		flagImage: "/flags/rs.svg",
		isActive: true,
	},
	{
		id: 245,
		name: "Голландия",
		code: "NL",
		flagImage: "/flags/nl.svg",
		isActive: true,
	},
] as const;

export type Country = (typeof COUNTRIES)[number];

/**
 * Get country by ID
 * O(n) lookup - fine for small dataset (≤20 countries)
 */
export function getCountryById(id: number): Country | undefined {
	return COUNTRIES.find((c) => c.id === id);
}

/**
 * Get country by code (e.g., "RU", "DE")
 */
export function getCountryByCode(code: string): Country | undefined {
	return COUNTRIES.find((c) => c.code === code);
}

/**
 * Get all active countries
 */
export function getActiveCountries(): Country[] {
	return COUNTRIES.filter((c) => c.isActive);
}

/**
 * Get all countries (including inactive)
 */
export function getAllCountries(): Country[] {
	return [...COUNTRIES];
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================
//
// Instead of:
//   const countries = await db.select().from(countries);
//
// Use:
//   import { COUNTRIES, getActiveCountries } from "~/data/countries";
//   const countries = getActiveCountries();
//
// Benefits:
// - Zero database queries
// - Instant access
// - Type-safe
// - Works perfectly on Vercel
// ============================================================================
