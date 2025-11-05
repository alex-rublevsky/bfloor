import { Skeleton } from "~/components/ui/dashboard/skeleton";

// ImageGallery Skeleton Component
function ImageGallerySkeleton() {
	return (
		<div className="gallery-stack flex flex-col lg:flex-row w-full gap-2 lg:pl-4 lg:pt-4 lg:pb-4">
			{/* Thumbnails */}
			<div className="order-2 lg:order-1 shrink-0 w-full lg:w-24 overflow-x-auto lg:overflow-x-hidden scrollbar-none">
				{/* Scrollable container */}
				<div className="no-scrollbar flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto px-4 lg:px-0 scroll-smooth">
					{/* Multiple thumbnail skeletons */}
					{[
						<div
							key="thumbnail-1"
							className="shrink-0 w-24 h-24 relative last:mb-2"
						>
							<div className="absolute inset-0 rounded-sm overflow-hidden">
								<Skeleton className="w-full h-full rounded-sm" />
							</div>
						</div>,
						<div
							key="thumbnail-2"
							className="shrink-0 w-24 h-24 relative last:mb-2"
						>
							<div className="absolute inset-0 rounded-sm overflow-hidden">
								<Skeleton className="w-full h-full rounded-sm" />
							</div>
						</div>,
						<div
							key="thumbnail-3"
							className="shrink-0 w-24 h-24 relative last:mb-2"
						>
							<div className="absolute inset-0 rounded-sm overflow-hidden">
								<Skeleton className="w-full h-full rounded-sm" />
							</div>
						</div>,
						<div
							key="thumbnail-4"
							className="shrink-0 w-24 h-24 relative last:mb-2"
						>
							<div className="absolute inset-0 rounded-sm overflow-hidden">
								<Skeleton className="w-full h-full rounded-sm" />
							</div>
						</div>,
					]}
				</div>
			</div>

			{/* Main image */}
			<div className="flex items-center justify-center lg:items-start lg:justify-start order-1 grow relative">
				<div className="relative w-full h-[60vh] lg:h-auto overflow-x-auto lg:overflow-x-hidden overflow-y-hidden scroll-smooth snap-x snap-mandatory lg:snap-none">
					{/* Mobile sliding images container */}
					<div className="flex lg:hidden h-full">
						{[
							<div
								key="mobile-image-1"
								className="shrink-0 w-full snap-center flex items-center justify-center"
							>
								<div className="relative w-full h-full flex items-center justify-center">
									<div className="relative w-auto h-full flex items-center justify-center">
										<Skeleton className="aspect-square w-auto h-full max-h-[60vh] rounded-none" />
									</div>
								</div>
							</div>,
							<div
								key="mobile-image-2"
								className="shrink-0 w-full snap-center flex items-center justify-center"
							>
								<div className="relative w-full h-full flex items-center justify-center">
									<div className="relative w-auto h-full flex items-center justify-center">
										<Skeleton className="aspect-square w-auto h-full max-h-[60vh] rounded-none" />
									</div>
								</div>
							</div>,
							<div
								key="mobile-image-3"
								className="shrink-0 w-full snap-center flex items-center justify-center"
							>
								<div className="relative w-full h-full flex items-center justify-center">
									<div className="relative w-auto h-full flex items-center justify-center">
										<Skeleton className="aspect-square w-auto h-full max-h-[60vh] rounded-none" />
									</div>
								</div>
							</div>,
							<div
								key="mobile-image-4"
								className="shrink-0 w-full snap-center flex items-center justify-center"
							>
								<div className="relative w-full h-full flex items-center justify-center">
									<div className="relative w-auto h-full flex items-center justify-center">
										<Skeleton className="aspect-square w-auto h-full max-h-[60vh] rounded-none" />
									</div>
								</div>
							</div>,
						]}
					</div>

					{/* Desktop selected image */}
					<div className="hidden lg:block">
						<Skeleton className="aspect-square w-auto h-auto max-h-[calc(100vh-5rem)] rounded-lg" />
					</div>
				</div>
			</div>
		</div>
	);
}

export function ProductPageSkeleton() {
	return (
		<div className="min-h-screen flex flex-col lg:h-screen lg:overflow-hidden">
			<div className="grow flex items-start justify-center">
				<div className="w-full h-full flex flex-col lg:flex-row gap-0 lg:gap-10 items-start">
					{/* Image gallery section */}
					<div className="w-full lg:w-3/5 xl:w-2/3 flex flex-col lg:flex-row gap-2 lg:h-full self-start">
						<ImageGallerySkeleton />
					</div>

					{/* Product information section */}
					<div className="w-full lg:w-2/5 xl:w-1/3 px-4 lg:px-0 lg:h-[100dvh] lg:overflow-y-auto pt-4 pb-20 lg:pr-4 scrollbar-none">
						<div className="space-y-6 w-full">
							{/* Product name */}
							<Skeleton className="h-8 w-3/4" />

							{/* Price section */}
							<div className="flex gap-4 items-center">
								<Skeleton className="h-6 w-32" />
								<Skeleton className="h-6 w-20" />
							</div>

							{/* Variation selection */}
							<div className="flex flex-wrap gap-4">
								{/* First variation group */}
								<div className="space-y-2">
									<Skeleton className="h-5 w-12" />
									<div className="flex flex-wrap gap-2">
										<Skeleton className="h-10 w-12 rounded-full" />
										<Skeleton className="h-10 w-12 rounded-full" />
										<Skeleton className="h-10 w-12 rounded-full" />
									</div>
								</div>

								{/* Second variation group */}
								<div className="space-y-2">
									<Skeleton className="h-5 w-16" />
									<div className="flex flex-wrap gap-2">
										<Skeleton className="h-10 w-16 rounded-full" />
										<Skeleton className="h-10 w-20 rounded-full" />
									</div>
								</div>
							</div>

							{/* Quantity selector and Add to cart */}
							<div className="flex flex-wrap items-center gap-4">
								<Skeleton className="h-12 w-32" />
								<Skeleton className="h-12 w-32" />
							</div>

							{/* Blog post link */}
							<div className="pt-4">
								<Skeleton className="h-5 w-48" />
							</div>

							{/* Product description */}
							<div className="prose max-w-none space-y-3">
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-5/6" />
								<Skeleton className="h-4 w-4/5" />
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-3/4" />
							</div>

							{/* Metadata */}
							<div className="space-y-2">
								<div className="flex items-center gap-2">
									<Skeleton className="h-4 w-16" />
									<Skeleton className="h-4 w-24" />
								</div>
								<div className="flex items-center gap-2">
									<Skeleton className="h-4 w-12" />
									<Skeleton className="h-4 w-20" />
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
