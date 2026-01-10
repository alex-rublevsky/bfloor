export const STORE_LOCATIONS = [
	{
		id: 1,
		address: "ул. Русская, 78",
		description: "Вход со стороны дороги",
		openingHours: "Пн — Пт: 10 — 18\nСб: 11 — 17\nВс: Выходной",
	},
	{
		id: 2,
		address: "ул. 100 летия, 30",
		description: null,
		openingHours: "Пн — Пт: 10 — 18\nСб: 11 — 17\nВс: Выходной",
	},
] as const;

export type StoreLocation = (typeof STORE_LOCATIONS)[number];

export function getAllStoreLocations(): StoreLocation[] {
	return [...STORE_LOCATIONS];
}

export function getStoreLocationsByIds(ids: number[]): StoreLocation[] {
	return STORE_LOCATIONS.filter((location) => ids.includes(location.id));
}
