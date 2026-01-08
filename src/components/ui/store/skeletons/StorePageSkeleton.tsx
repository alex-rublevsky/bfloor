/**
 * Store Page Skeleton
 * Loading state for the store index page
 * Matches the actual store page layout with proper spacing and structure
 */

// Simple fixed number of skeleton cards
const SKELETON_CARDS = Array.from(
	{ length: 18 },
	(_, i) => `store-skeleton-card-${i}`,
);

export function StorePageSkeleton() {
	return (
		<div className="min-h-screen flex flex-col">
			{/* Title and Filter Pills Section Skeleton */}
			<div className="px-4 pt-6 pb-4">
				{/* Title skeleton - taller to better match actual title */}
				<div className="h-10 md:h-12 bg-muted animate-pulse rounded w-48" />
			</div>

			{/* Products Grid Skeleton - no horizontal padding to match actual layout */}
			<div className="py-4 flex-1">
				<div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 md:gap-3">
					{SKELETON_CARDS.map((key) => (
						<div key={key} className="w-full bg-background">
							{/* Image skeleton - aspect-square to match ProductCard */}
							<div className="aspect-square bg-muted animate-pulse" />

							{/* Content skeleton - matching ProductCard structure */}
							<div className="p-4 flex flex-col space-y-2">
								{/* Price skeleton */}
								<div className="h-7 bg-muted animate-pulse rounded w-20 mb-2" />

								{/* Product name skeleton */}
								<div className="h-5 bg-muted animate-pulse rounded w-3/4 mb-3" />

								{/* Mobile button skeleton */}
								<div className="md:hidden mt-auto">
									<div className="h-10 bg-muted animate-pulse rounded w-full" />
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
