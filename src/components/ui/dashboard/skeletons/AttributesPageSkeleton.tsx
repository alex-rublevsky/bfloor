import { Skeleton } from "~/components/ui/dashboard/skeleton";

export function AttributesPageSkeleton() {
	return (
		<div className="space-y-6 px-6 py-6">
			{/* Header */}
			<div className="flex justify-between items-center">
				<div>
					<h1 className="relative">
						<span className="invisible">Attributes Management</span>
						<Skeleton className="absolute inset-0 w-48" />
					</h1>
				</div>
			</div>

			{/* Attributes Grid */}
			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
				{Array.from({ length: 10 }, (_, index) => (
					<div
						key={`attribute-skeleton-${index}`}
						className="border border-muted rounded-lg p-4 bg-card space-y-2"
					>
						<div className="flex items-center gap-2">
							<div className="relative flex-1">
								<span className="invisible">Attribute Name</span>
								<Skeleton className="absolute inset-0 w-24" />
							</div>
							<div className="relative">
								<span className="invisible">0</span>
								<Skeleton className="absolute inset-0 w-6 h-4 rounded" />
							</div>
						</div>
						<div className="relative">
							<span className="invisible text-xs">attribute-slug</span>
							<Skeleton className="absolute inset-0 w-20 h-3" />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}


