import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { StoreCatalogSkeleton } from "~/components/ui/store/skeletons/StoreCatalogSkeleton";
import { CATEGORY_CATALOG_IMAGES } from "~/constants/categoryCatalogImages";
import { ASSETS_BASE_URL } from "~/constants/urls";
import { usePrefetch } from "~/hooks/usePrefetch";
import {
	categoriesQueryOptions,
	productCategoryCountsQueryOptions,
} from "~/lib/queryOptions";
import styles from "~/components/ui/store/productCard.module.css";
import { seo } from "~/utils/seo";

export const Route = createFileRoute("/store/")({
	component: StoreCatalogPage,
	pendingComponent: StoreCatalogSkeleton,
	loader: async ({ context: { queryClient } }) => {
		await Promise.all([
			queryClient.ensureQueryData(categoriesQueryOptions()),
			queryClient.ensureQueryData(productCategoryCountsQueryOptions()),
		]);
	},
	head: () => ({
		meta: [
			...seo({
				title: "Каталог - BeautyFloor",
				description:
					"Ламинат, инженерная доска, ковролин и другие напольные покрытия во Владивостоке",
			}),
		],
	}),
});

// Placeholder when category has no image (for later: replace with real images)
const CategoryImagePlaceholder = ({ className }: { className?: string }) => (
	<div
		className={`bg-muted flex items-center justify-center ${className}`}
		aria-hidden
	>
		<svg
			className="w-12 h-12 text-muted-foreground/60"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<title>Категория</title>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={1.5}
				d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
			/>
		</svg>
	</div>
);

function StoreCatalogPage() {
	const { prefetchStoreWithCategory } = usePrefetch();
	const { data: categories = [] } = useSuspenseQuery(categoriesQueryOptions());
	const { data: counts } = useSuspenseQuery(
		productCategoryCountsQueryOptions(),
	);

	const activeCategories = useMemo(() => {
		return categories
			.filter((cat) => cat.isActive)
			.sort((a, b) => a.order - b.order)
			.map((category) => ({
				...category,
				productCount: counts?.[category.slug] ?? null,
			}));
	}, [categories, counts]);

	return (
		<div className="min-h-[calc(100vh-4rem)] flex flex-col">
			{/* Catalog grid - same format as StoreProductGrid (px-4, no max-w); window scrolls so navbar hide/show on scroll works */}
			<div className="flex-1 min-h-0">
				{/* Same format as $categorySlug: title has px-4, grid is edge-to-edge (no horizontal padding) */}
				<div className="py-6 md:py-10">
					<h1 className="text-2xl md:text-3xl font-semibold mb-6 md:mb-8 px-4">
						Каталог
					</h1>

					{activeCategories.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-20 text-muted-foreground px-4">
							<p>Нет категорий</p>
						</div>
					) : (
						<div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 md:gap-3">
							{activeCategories.map((category) => {
								const entry = CATEGORY_CATALOG_IMAGES[category.slug];
								const imagePath = entry?.image ?? category.image;
								return (
									<Link
										key={category.slug}
										to="/store/$categorySlug"
										params={{ categorySlug: category.slug }}
										viewTransition={true}
										preload="intent"
										onMouseEnter={() =>
											prefetchStoreWithCategory(category.slug)
										}
										className="block h-full relative focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
									>
										{/* Card structure matching ProductCard (product-card, overflow-hidden, group, transition-standard) */}
										<div
											className={`w-full product-card overflow-hidden group transition-standard ${styles.categoryCard}`}
										>
											<div className="bg-background flex flex-col">
												{/* Image: same as ProductCard – relative aspect-square overflow-hidden */}
												<div className="relative aspect-square overflow-hidden">
													<div className="relative aspect-square flex items-center justify-center overflow-hidden">
														{imagePath ? (
															<img
																src={`${ASSETS_BASE_URL}/${imagePath}`}
																alt={category.name}
																className="absolute inset-0 w-full h-full object-cover object-center transition-standard"
																style={{
																	viewTransitionName: entry?.productSlug
																		? `product-image-${entry.productSlug}`
																		: undefined,
																}}
															/>
														) : (
															<CategoryImagePlaceholder className="absolute inset-0 w-full h-full" />
														)}
													</div>
												</div>

												{/* Content: same structure as ProductCard – flex flex-col, padding, name + count */}
												<div className="flex flex-col h-auto md:h-full md:p-4 pb-4">
													<div className="px-4 pt-4 md:px-0 md:pt-0 flex flex-col h-auto md:h-full">
														<div className="flex flex-col mb-2">
															<p className="text-foreground">{category.name}</p>
															{category.productCount !== null && (
																<span className="text-sm text-muted-foreground mt-0.5">
																	{category.productCount} товаров
																</span>
															)}
														</div>
													</div>
												</div>
											</div>
										</div>
									</Link>
								);
							})}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
