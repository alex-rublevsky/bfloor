export function OrdersPageSkeleton() {
	return (
		<div className="space-y-6 animate-pulse">
			{/* Header with count and search */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4">
				<div className="h-5 w-32 bg-muted rounded"></div>
				<div className="h-10 w-full sm:w-64 bg-muted rounded"></div>
			</div>

			{/* Orders Groups */}
			<div className="space-y-8">
				{/* Group 1 */}
				<div className="space-y-4">
					{/* Group Title */}
					<div className="px-4">
						<div className="h-8 w-48 bg-muted rounded"></div>
					</div>

					{/* Orders Grid */}
					<div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 md:gap-3 px-4">
						{Array.from({ length: 6 }, (_, i) => `skeleton-${i}`).map((key) => (
							<div
								key={key}
								className="border rounded-lg p-4 space-y-4 bg-card"
							>
								{/* Header */}
								<div className="flex items-start justify-between gap-2">
									<div className="space-y-2 flex-1">
										<div className="h-4 w-16 bg-muted rounded"></div>
										<div className="h-3 w-24 bg-muted rounded"></div>
									</div>
									<div className="h-5 w-16 bg-muted rounded-full"></div>
								</div>

								{/* Order Items */}
								<div className="space-y-2">
									<div className="flex items-center gap-2">
										<div className="w-12 h-12 bg-muted rounded"></div>
										<div className="flex-1 space-y-1">
											<div className="h-3 w-full bg-muted rounded"></div>
											<div className="h-3 w-2/3 bg-muted rounded"></div>
										</div>
										<div className="h-3 w-12 bg-muted rounded"></div>
									</div>
									<div className="h-3 w-24 bg-muted rounded"></div>
								</div>

								{/* Customer Info */}
								<div className="space-y-1">
									<div className="h-3 w-full bg-muted rounded"></div>
									<div className="h-3 w-3/4 bg-muted rounded"></div>
								</div>

								{/* Price and Toggle */}
								<div className="flex items-center justify-between pt-2 border-t">
									<div className="h-5 w-20 bg-muted rounded"></div>
									<div className="h-8 w-24 bg-muted rounded"></div>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
