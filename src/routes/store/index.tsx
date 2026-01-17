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
					"Напольные покрытия во Владивостоке. Выберите категорию: ламинат, инженерная доска и другие.",
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
		<div className="h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)] flex flex-col min-h-0">
			{/* Full-height catalog grid - no scroll on desktop, minimal on mobile */}
			<div className="flex-1 min-h-0 overflow-auto">
				<div className="max-w-6xl mx-auto px-4 py-6 md:py-10">
					<h1 className="text-2xl md:text-3xl font-semibold mb-6 md:mb-8">
						Каталог
					</h1>

					{activeCategories.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
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
										onMouseEnter={() =>
											prefetchStoreWithCategory(category.slug)
										}
										className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 overflow-hidden border border-border hover:border-accent hover:shadow-md transition-standard"
									>
										{/* Image: square, not rounded – same as ProductCard on category page */}
										<div className="aspect-square bg-muted/50 overflow-hidden">
											{imagePath ? (
												<img
													src={`${ASSETS_BASE_URL}/${imagePath}`}
													alt={category.name}
													className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
													style={{
														// Match ProductCard's product-image-{slug} so catalog → category morphs into that product's card
														viewTransitionName: entry?.productSlug
															? `product-image-${entry.productSlug}`
															: undefined,
													}}
												/>
											) : (
												<CategoryImagePlaceholder className="w-full h-full" />
											)}
										</div>
										{/* Label */}
										<div className="p-3 md:p-4">
											<span className="font-medium text-foreground group-hover:text-accent transition-colors">
												{category.name}
											</span>
											{category.productCount !== null && (
												<span className="block text-sm text-muted-foreground mt-0.5">
													{category.productCount} товаров
												</span>
											)}
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
