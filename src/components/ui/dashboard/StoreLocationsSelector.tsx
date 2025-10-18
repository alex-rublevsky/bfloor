import { Checkbox } from "~/components/ui/shared/Checkbox";
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
	return (
		<fieldset>
			<legend className="text-lg font-medium mb-4">Store Locations</legend>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{storeLocations
					.filter((location) => location.isActive)
					.map((location) => (
						<label
							key={location.id}
							htmlFor={`${idPrefix}-store-location-${location.id}`}
							className="flex items-center space-x-2 cursor-pointer"
						>
							<Checkbox
								id={`${idPrefix}-store-location-${location.id}`}
								name={`storeLocation-${location.id}`}
								checked={selectedLocationIds?.includes(location.id) || false}
								onCheckedChange={(checked) => {
									onLocationChange(location.id, !!checked);
								}}
							/>
							<div className="flex flex-col">
								<span className="text-sm font-medium">{location.address}</span>
								{location.description && (
									<span className="text-xs text-muted-foreground">
										{location.description}
									</span>
								)}
							</div>
						</label>
					))}
			</div>
		</fieldset>
	);
}
