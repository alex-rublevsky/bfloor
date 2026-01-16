import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
	DrawerBody,
	DrawerClose,
	DrawerHeader,
	DrawerTitle,
} from "~/components/ui/shared/Drawer";
import { Link } from "~/components/ui/shared/Link";
import { usePrefetch } from "~/hooks/usePrefetch";
import {
	categoriesQueryOptions,
	productCategoryCountsQueryOptions,
} from "~/lib/queryOptions";

export function CatalogDrawerContent() {
	const { data: categories = [] } = useQuery({
		...categoriesQueryOptions(),
	});

	// Load category counts separately (streams in after categories)
	const { data: counts } = useQuery(productCategoryCountsQueryOptions());

	// Get prefetch hook for category hover
	const { prefetchStoreWithCategory } = usePrefetch();

	// Filter active categories and sort by order
	const activeCategories = useMemo(() => {
		return categories
			.filter((cat) => cat.isActive)
			.sort((a, b) => a.order - b.order)
			.map((category) => ({
				...category,
				productCount: counts?.[category.slug] ?? null, // null = still loading
			}));
	}, [categories, counts]);

	return (
		<>
			<DrawerHeader>
				<DrawerTitle>Каталог</DrawerTitle>
			</DrawerHeader>

			<DrawerBody>
				{activeCategories.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-full">
						<p className="text-muted-foreground">Нет категорий</p>
					</div>
				) : (
					<div className="space-y-0">
						{activeCategories.map((category) => (
							<DrawerClose asChild key={category.slug}>
								<Link
									href={`/store?category=${category.slug}`}
									disableAnimation={true}
									onMouseEnter={() => {
										// Prefetch store data for this category on hover
										prefetchStoreWithCategory(category.slug);
									}}
									className="whitespace-normal! flex items-center justify-between w-full px-4 py-2 text-sm text-foreground hover:bg-primary hover:text-primary-foreground! transition-standard"
								>
									<span className="flex-1 min-w-0 pr-3 wrap-break-word">
										{category.name}
									</span>
									{category.productCount !== null && (
										<span className="text-xs opacity-70 shrink-0">
											{category.productCount}
										</span>
									)}
								</Link>
							</DrawerClose>
						))}
					</div>
				)}
			</DrawerBody>
		</>
	);
}
