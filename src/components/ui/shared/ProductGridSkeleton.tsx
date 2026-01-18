/**
 * Reusable product grid skeleton component
 * Used on both store page and dashboard products page during loading.
 * @param gridClassName - Optional. Use "px-4" for padded layout (e.g. dashboard); omit for edge-to-edge (store).
 */
export function ProductGridSkeleton({
	itemCount = 18,
	gridClassName,
}: {
	itemCount?: number;
	gridClassName?: string;
}) {
	return (
		<div className="py-4 flex-1">
			<div className={`grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 md:gap-3 ${gridClassName ?? ""}`}>
				{Array.from({ length: itemCount }, (_, i) => `skeleton-${i}`).map(
					(key) => (
						<div key={key} className="w-full bg-background">
							<div className="aspect-square bg-muted animate-pulse" />
							<div className="p-4 flex flex-col space-y-2">
								<div className="h-7 bg-muted animate-pulse rounded w-20 mb-2" />
								<div className="h-5 bg-muted animate-pulse rounded w-3/4 mb-3" />
								<div className="md:hidden mt-auto">
									<div className="h-10 bg-muted animate-pulse rounded w-full" />
								</div>
							</div>
						</div>
					),
				)}
			</div>
		</div>
	);
}
