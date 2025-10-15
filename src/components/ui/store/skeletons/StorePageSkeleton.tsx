/**
 * Store Page Skeleton
 * Loading state for the store index page
 */

export function StorePageSkeleton() {
	return (
		<section className="no-padding space-y-8">
			<div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between px-4 pt-24 sm:pt-32 mb-8">
				{/* Filters skeleton */}
				<div className="flex gap-2">
					<div className="h-10 w-24 bg-muted animate-pulse rounded" />
					<div className="h-10 w-24 bg-muted animate-pulse rounded" />
					<div className="h-10 w-24 bg-muted animate-pulse rounded" />
				</div>
				{/* Sort skeleton */}
				<div className="h-10 w-32 bg-muted animate-pulse rounded" />
			</div>

			{/* Products grid skeleton */}
			<div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 md:gap-3 mb-20">
				{Array.from({ length: 12 }, (_, i) => (
					<div key={`store-skeleton-card-${i}`} className="w-full">
						{/* Image skeleton */}
						<div className="aspect-square bg-muted animate-pulse rounded-t" />
						{/* Content skeleton */}
						<div className="p-4 space-y-3">
							<div className="h-5 bg-muted animate-pulse rounded w-3/4" />
							<div className="h-4 bg-muted animate-pulse rounded w-1/2" />
							<div className="flex gap-2">
								<div className="h-8 bg-muted animate-pulse rounded w-16" />
								<div className="h-8 bg-muted animate-pulse rounded w-16" />
							</div>
						</div>
					</div>
				))}
			</div>
		</section>
	);
}
