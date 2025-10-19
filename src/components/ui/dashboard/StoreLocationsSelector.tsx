import { CheckboxList, type CheckboxListItem } from "~/components/ui/shared/CheckboxList";
import type { StoreLocation } from "~/types";

interface StoreLocationsSelectorProps {
	storeLocations: StoreLocation[];
	selectedLocationIds: number[];
	onLocationChange: (locationId: number, checked: boolean) => void;
	idPrefix: "edit" | "add" | "create";
}

export function StoreLocationsSelector({
	storeLocations,
	selectedLocationIds,
	onLocationChange,
	idPrefix,
}: StoreLocationsSelectorProps) {
	// Convert store locations to CheckboxListItem format
	const checkboxItems: CheckboxListItem[] = storeLocations.map((location) => ({
		id: location.id,
		label: location.address,
		description: location.description || undefined,
		isActive: location.isActive,
	}));

	return (
		<CheckboxList
			items={checkboxItems}
			selectedIds={selectedLocationIds}
			onItemChange={(itemId, checked) => {
				onLocationChange(itemId as number, checked);
			}}
			idPrefix={`${idPrefix}-store-location`}
			columns={2}
			showOnlyActive={true}
		/>
	);
}
