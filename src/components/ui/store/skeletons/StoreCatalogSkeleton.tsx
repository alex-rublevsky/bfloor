/**
 * Store Catalog Skeleton
 * Loading state for /store (category picker grid)
 */

const SKELETON_CARDS = 8;
const SKELETON_KEYS = Array.from(
	{ length: SKELETON_CARDS },
	(_, i) => `skeleton-card-${i}`,
);

export function StoreCatalogSkeleton() {
	return (
		<div className="min-h-[calc(100vh-4rem)] flex flex-col">
			<div className="flex-1 min-h-0">
				<div className="py-6 md:py-10">
					<div className="h-8 md:h-9 bg-muted animate-pulse rounded w-32 mb-6 md:mb-8 px-4" />
					<div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 md:gap-3">
						{SKELETON_KEYS.map((key) => (
							<div key={key} className="overflow-hidden border border-border">
								<div className="aspect-square bg-muted animate-pulse" />
								<div className="p-3 md:p-4 space-y-2">
									<div className="h-5 bg-muted animate-pulse rounded w-3/4" />
									<div className="h-4 bg-muted animate-pulse rounded w-16" />
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
