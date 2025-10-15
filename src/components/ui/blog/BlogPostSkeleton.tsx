/**
 * Blog Post Skeleton
 * Loading state for individual blog post pages
 */

export function BlogPostSkeleton() {
	return (
		<main className="min-h-screen flex flex-col lg:h-screen lg:overflow-hidden">
			<div className="grow flex items-start justify-center">
				<div className="w-full h-full flex flex-col lg:flex-row gap-0 lg:gap-10 items-start">
					{/* Image gallery skeleton */}
					<div className="w-full lg:flex-1 flex flex-col lg:flex-row gap-2 lg:h-full self-start">
						<div className="w-full h-[50vh] lg:h-full bg-muted animate-pulse" />
					</div>

					{/* Content skeleton */}
					<div className="w-full md:max-w-[45ch] lg:max-w-[55ch] xl:max-w-[65ch] px-4 lg:h-[100dvh] lg:overflow-y-auto pb-20 lg:pr-4 scrollbar-none lg:flex-shrink-0">
						<div className="space-y-6 w-full pt-4">
							{/* Title skeleton */}
							<div className="h-10 bg-muted animate-pulse rounded w-3/4" />

							{/* Date skeleton */}
							<div className="h-5 bg-muted animate-pulse rounded w-32" />

							{/* Content paragraphs skeleton */}
							<div className="space-y-4">
								<div className="h-4 bg-muted animate-pulse rounded w-full" />
								<div className="h-4 bg-muted animate-pulse rounded w-full" />
								<div className="h-4 bg-muted animate-pulse rounded w-5/6" />
								<div className="h-4 bg-muted animate-pulse rounded w-full" />
								<div className="h-4 bg-muted animate-pulse rounded w-4/5" />
								<div className="h-4 bg-muted animate-pulse rounded w-full" />
								<div className="h-4 bg-muted animate-pulse rounded w-full" />
								<div className="h-4 bg-muted animate-pulse rounded w-3/4" />
							</div>

							{/* Tags skeleton */}
							<div className="flex gap-2">
								<div className="h-6 bg-muted animate-pulse rounded w-16" />
								<div className="h-6 bg-muted animate-pulse rounded w-20" />
							</div>
						</div>
					</div>
				</div>
			</div>
		</main>
	);
}
