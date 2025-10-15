/**
 * Blog Index Skeleton
 * Loading state for the blog index page
 */

export function BlogIndexSkeleton() {
	return (
		<main>
			<section className="pt-24 sm:pt-32 div min-h-screen no-padding">
				<div>
					{/* Header skeleton */}
					<div className="text-center mb-12 px-4">
						<div className="h-12 bg-muted animate-pulse rounded w-64 mx-auto mb-8" />
						<div className="flex justify-center items-center gap-8 mb-8">
							<div className="h-6 bg-muted animate-pulse rounded w-20" />
							<div className="h-6 bg-muted animate-pulse rounded w-32" />
						</div>
					</div>

					{/* Filters skeleton */}
					<div className="flex justify-center mb-12 px-4">
						<div className="flex gap-2">
							<div className="h-10 w-24 bg-muted animate-pulse rounded" />
							<div className="h-10 w-24 bg-muted animate-pulse rounded" />
							<div className="h-10 w-24 bg-muted animate-pulse rounded" />
						</div>
					</div>

					{/* Blog cards grid skeleton */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-y-6 gap-x-3 sm:gap-4 items-start">
						{Array.from({ length: 8 }).map((_, i) => (
							<div key={`blog-skeleton-card-${i}`} className="w-full">
								{/* Image skeleton */}
								<div className="aspect-[4/3] bg-muted animate-pulse rounded-t" />
								{/* Content skeleton */}
								<div className="p-4 space-y-3">
									<div className="h-6 bg-muted animate-pulse rounded w-3/4" />
									<div className="space-y-2">
										<div className="h-4 bg-muted animate-pulse rounded w-full" />
										<div className="h-4 bg-muted animate-pulse rounded w-5/6" />
									</div>
									<div className="flex justify-between items-center">
										<div className="h-4 bg-muted animate-pulse rounded w-20" />
										<div className="flex gap-2">
											<div className="h-6 bg-muted animate-pulse rounded w-12" />
											<div className="h-6 bg-muted animate-pulse rounded w-12" />
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>
		</main>
	);
}
