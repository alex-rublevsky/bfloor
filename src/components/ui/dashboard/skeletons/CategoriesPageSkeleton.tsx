import { Skeleton } from "~/components/ui/dashboard/skeleton";

export function CategoriesPageSkeleton() {
	return (
		<div className="space-y-6 px-6">
			{/* Header */}
			<div className="flex justify-between items-center">
				<div>
					<h1 className="relative">
						<span className="invisible">Categories Management</span>
						<Skeleton className="absolute inset-0 w-48" />
					</h1>
				</div>
			</div>

			{/* Two-column layout for categories */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
				{/* Product Categories Section */}
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<h3 className="text-lg font-medium relative">
							<span className="invisible">Product Categories</span>
							<Skeleton className="absolute inset-0 w-40" />
						</h3>
						<div className="relative">
							<button type="button" className="h-8 px-3 invisible" disabled>
								<span>Add Category</span>
							</button>
							<Skeleton className="absolute inset-0 rounded" />
						</div>
					</div>

					<div>
						<div className="overflow-x-auto">
							<table className="min-w-full">
								<tbody className="divide-y divide-border">
									{Array.from({ length: 5 }, (_, index) => (
										<tr
											key={`product-category-skeleton-${Date.now()}-${index}`}
											className="hover:bg-muted/30"
										>
											<td className="px-1 py-4">
												<div>
													<div className="font-medium relative">
														<span className="invisible">Category Name</span>
														<Skeleton className="absolute inset-0 w-32" />
													</div>
													<div className="text-sm text-muted-foreground relative mt-1">
														<span className="invisible">category-slug</span>
														<Skeleton className="absolute inset-0 w-24" />
													</div>
												</div>
											</td>
											<td className="px-1 py-4">
												<div className="relative">
													<span className="invisible">Active</span>
													<Skeleton className="absolute inset-0 w-16 h-6 rounded-full" />
												</div>
											</td>
											<td className="px-1 py-4 text-right">
												<div className="flex space-x-2 justify-end">
													<div className="relative">
														<button
															type="button"
															className="h-8 px-3 invisible"
															disabled
														>
															<span>Edit</span>
														</button>
														<Skeleton className="absolute inset-0 rounded" />
													</div>
													<div className="relative">
														<button
															type="button"
															className="h-8 px-3 invisible"
															disabled
														>
															<span>Delete</span>
														</button>
														<Skeleton className="absolute inset-0 rounded" />
													</div>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</div>

				{/* Tea Categories Section */}
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<h3 className="text-lg font-medium relative">
							<span className="invisible">Tea Categories</span>
							<Skeleton className="absolute inset-0 w-32" />
						</h3>
						<div className="relative">
							<button type="button" className="h-8 px-3 invisible" disabled>
								<span>Add Tea Category</span>
							</button>
							<Skeleton className="absolute inset-0 rounded" />
						</div>
					</div>

					<div>
						<div className="overflow-x-auto">
							<table className="min-w-full">
								<tbody className="divide-y divide-border">
									{Array.from({ length: 4 }, (_, index) => (
										<tr
											key={`tea-category-skeleton-${Date.now()}-${index}`}
											className="hover:bg-muted/30"
										>
											<td className="px-1 py-4">
												<div>
													<div className="font-medium relative">
														<span className="invisible">Tea Category Name</span>
														<Skeleton className="absolute inset-0 w-36" />
													</div>
													<div className="text-sm text-muted-foreground relative mt-1">
														<span className="invisible">tea-category-slug</span>
														<Skeleton className="absolute inset-0 w-28" />
													</div>
												</div>
											</td>
											<td className="px-1 py-4">
												<div className="relative">
													<span className="invisible">Active</span>
													<Skeleton className="absolute inset-0 w-16 h-6 rounded-full" />
												</div>
											</td>
											<td className="px-1 py-4 text-right">
												<div className="flex space-x-2 justify-end">
													<div className="relative">
														<button
															type="button"
															className="h-8 px-3 invisible"
															disabled
														>
															<span>Edit</span>
														</button>
														<Skeleton className="absolute inset-0 rounded" />
													</div>
													<div className="relative">
														<button
															type="button"
															className="h-8 px-3 invisible"
															disabled
														>
															<span>Delete</span>
														</button>
														<Skeleton className="absolute inset-0 rounded" />
													</div>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
