import { createFileRoute } from "@tanstack/react-router";
import { EntityCardContent } from "~/components/ui/dashboard/EntityCardContent";
import { getAllStoreLocations } from "~/data/storeLocations";

export const Route = createFileRoute("/dashboard/misc")({
	component: RouteComponent,
});

function RouteComponent() {
	// Get store locations from hardcoded data
	const locations = getAllStoreLocations();

	return (
		<div className="space-y-6 px-6 py-6">
			{/* Main grid layout - 3 columns on desktop, 1 column on mobile */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Store Addresses Card - Read Only */}
				<div className="space-y-4">
					<div className="flex flex-col gap-2">
						<h3 className="text-lg font-semibold">Адреса магазинов</h3>
					</div>

					{/* Use EntityCardGrid container styling but with custom cards */}
					<div className="border border-border rounded-lg p-4 bg-transparent">
						<div className="grid grid-cols-1 gap-3">
							{locations.map((location) => (
								<div
									key={location.id}
									className="flex flex-col p-3 rounded-md bg-muted/30 border border-border w-full"
								>
									<div className="flex items-center space-x-2">
										<EntityCardContent
											name={location.address}
											secondaryInfo={location.description || undefined}
										/>
									</div>
									{location.openingHours && (
										<div className="text-xs text-muted-foreground whitespace-pre-line break-words mt-2 ml-0">
											{location.openingHours}
										</div>
									)}
								</div>
							))}
						</div>
					</div>
				</div>

				{/* Placeholder for future cards */}
				<div className="lg:col-span-2 space-y-6">
					{/* Additional cards will be added here in the future */}
				</div>
			</div>
		</div>
	);
}
