import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
	createFileRoute,
	stripSearchParams,
	useElementScrollRestoration,
} from "@tanstack/react-router";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useMemo, useRef, useState } from "react";
import { EmptyState } from "~/components/ui/shared/EmptyState";
import ProductCard from "~/components/ui/store/ProductCard";
import ProductFilters from "~/components/ui/store/ProductFilters";
import { StorePageSkeleton } from "~/components/ui/store/skeletons/StorePageSkeleton";
import { useClientSearch } from "~/lib/clientSearchContext";
import {
	brandsQueryOptions,
	categoriesQueryOptions,
	collectionsQueryOptions,
	storeDataInfiniteQueryOptions,
} from "~/lib/queryOptions.ts";
import type { Brand, CategoryWithCount, Collection } from "~/types";
import { seo } from "~/utils/seo";

// Simple search params validation for category filtering
const validateSearch = (search: Record<string, unknown>) => {
	const result: { category?: string } = {};

	if (typeof search.category === "string") {
		result.category = search.category;
	}

	return result;
};

export const Route = createFileRoute("/store/")({
	component: StorePage,
	validateSearch,
	// Strip undefined values from URL to keep it clean
	search: {
		middlewares: [stripSearchParams({})],
	},
	head: () => ({
		meta: [
			...seo({
				title: "Store - Rublevsky Studio",
				description:
					"Tea, handmade clothing prints, posters, and stickers. Premium quality products for tea enthusiasts and design lovers.",
			}),
		],
	}),
});

// Hook to get responsive columns per row based on screen size
function useResponsiveColumns() {
	const [columnsPerRow, setColumnsPerRow] = useState(6);

	useEffect(() => {
		const updateColumns = () => {
			const width = window.innerWidth;
			if (width >= 1536) {
				setColumnsPerRow(6); // 2xl
			} else if (width >= 1280) {
				setColumnsPerRow(5); // xl
			} else if (width >= 1024) {
				setColumnsPerRow(4); // lg
			} else if (width >= 768) {
				setColumnsPerRow(3); // md
			} else {
				setColumnsPerRow(2); // sm and below
			}
		};

		// Set initial value
		updateColumns();

		// Update on resize
		window.addEventListener("resize", updateColumns);
		return () => window.removeEventListener("resize", updateColumns);
	}, []);

	return columnsPerRow;
}

function StorePage() {
	const containerRef = useRef<HTMLDivElement>(null);
	const columnsPerRow = useResponsiveColumns();

	// Get search term from context (same as dashboard)
	const clientSearch = useClientSearch();
	const normalizedSearch = (() => {
		const value =
			typeof clientSearch.searchTerm === "string"
				? clientSearch.searchTerm
				: "";
		const trimmed = value.trim().replace(/\s+/g, " ");
		return trimmed.length >= 2 ? trimmed : undefined;
	})();

	// Filter state (matching dashboard)
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
	const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
	const [selectedCollection, setSelectedCollection] = useState<string | null>(
		null,
	);
	const [sortBy, setSortBy] = useState<
		"relevant" | "name" | "price-asc" | "price-desc" | "newest" | "oldest"
	>("relevant");
	const [currentPriceRange, setCurrentPriceRange] = useState<[number, number]>([
		0, 1000000,
	]);

	const isValidSort = (v: string): v is typeof sortBy => {
		return (
			v === "relevant" ||
			v === "name" ||
			v === "price-asc" ||
			v === "price-desc" ||
			v === "newest" ||
			v === "oldest"
		);
	};

	// Use infinite query to track loading state (same as dashboard)
	const {
		data: storeData,
		isLoading: isLoadingProducts,
		isFetching,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useInfiniteQuery({
		...storeDataInfiniteQueryOptions(normalizedSearch, {
			categorySlug: selectedCategory ?? undefined,
			brandSlug: selectedBrand ?? undefined,
			collectionSlug: selectedCollection ?? undefined,
			sort: sortBy,
		}),
		// Preserve previous data while new search/filters load
		placeholderData: (prev) => prev,
	});

	// Fetch all reference data separately with aggressive caching (3-day stale time)
	const { data: brands = [] } = useQuery({
		...brandsQueryOptions(),
	});

	const { data: collections = [] } = useQuery({
		...collectionsQueryOptions(),
	});

	const { data: categories = [] } = useQuery({
		...categoriesQueryOptions(),
	});

	// Merge products from all pages (same as dashboard)
	const products =
		storeData?.pages
			?.flatMap((page) => page?.products ?? [])
			?.filter(Boolean) ?? [];

	// Use merged products directly (search and filters are applied server-side)
	const allProducts = products;

	// Apply price range filter client-side (not supported server-side)
	const displayProducts = useMemo(() => {
		if (currentPriceRange[0] === 0 && currentPriceRange[1] === 1000000) {
			// No price filter applied
			return allProducts;
		}
		return allProducts.filter((product) => {
			const price = product.price || 0;
			return price >= currentPriceRange[0] && price <= currentPriceRange[1];
		});
	}, [allProducts, currentPriceRange]);

	// Scroll restoration for virtualized list
	// Following TanStack Router docs: https://tanstack.com/router/v1/docs/framework/react/guide/scroll-restoration#manual-scroll-restoration
	const scrollEntry = useElementScrollRestoration({
		getElement: () => window,
	});

	// Virtualizer configuration - responsive columns based on screen size
	// Following TanStack Virtual dynamic example pattern: https://tanstack.com/virtual/latest/docs/framework/react/examples/dynamic
	const itemHeight = 365;
	const rowCount = Math.ceil(displayProducts.length / columnsPerRow);

	const virtualizer = useWindowVirtualizer({
		count: rowCount,
		estimateSize: () => itemHeight,
		overscan: 8,
		initialOffset: scrollEntry?.scrollY,
	});

	// Re-measure rows when the number of columns changes
	// biome-ignore lint/correctness/useExhaustiveDependencies: We intentionally re-measure when columns change
	useEffect(() => {
		virtualizer.measure();
	}, [columnsPerRow, virtualizer]);

	// Re-measure on container width changes
	useEffect(() => {
		const el = containerRef.current;
		if (!el || typeof ResizeObserver === "undefined") return;
		const ro = new ResizeObserver(() => {
			virtualizer.measure();
		});
		ro.observe(el);
		return () => ro.disconnect();
	}, [virtualizer]);

	// Helper function to get products for a specific row
	const getProductsForRow = (rowIndex: number) => {
		const startIndex = rowIndex * columnsPerRow;
		const endIndex = Math.min(
			startIndex + columnsPerRow,
			displayProducts.length,
		);
		return displayProducts.slice(startIndex, endIndex);
	};

	// Infinite scroll - load more products when user scrolls near the end
	const virtualItems = virtualizer.getVirtualItems();
	useEffect(() => {
		const lastItem = virtualItems[virtualItems.length - 1];

		// Don't fetch if already fetching, no next page, or no items rendered
		if (!lastItem || !hasNextPage || isFetchingNextPage) return;

		// Fetch next page when user scrolls near the end
		const threshold = rowCount - 8;

		if (lastItem.index >= threshold) {
			fetchNextPage();
		}
	}, [virtualItems, hasNextPage, isFetchingNextPage, rowCount, fetchNextPage]);

	// Show skeleton only on very first load with no data
	if (!storeData && (isLoadingProducts || isFetching)) {
		return <StorePageSkeleton />;
	}

	return (
		<>
			{/* Filters bar (reusing store ProductFilters for hide-on-scroll behavior) */}
			<div ref={containerRef}>
				<ProductFilters
					categories={categories.map(
						(c): CategoryWithCount => ({
							...c,
							count: 0,
						}),
					)}
					selectedCategory={selectedCategory}
					onCategoryChange={setSelectedCategory}
					brands={brands.map((b: Brand) => ({ slug: b.slug, name: b.name }))}
					selectedBrand={selectedBrand}
					onBrandChange={setSelectedBrand}
					collections={collections.map((co: Collection) => ({
						slug: co.slug,
						name: co.name,
					}))}
					selectedCollection={selectedCollection}
					onCollectionChange={setSelectedCollection}
					priceRange={{ min: 0, max: 1000000 }}
					currentPriceRange={currentPriceRange}
					onPriceRangeChange={setCurrentPriceRange}
					sortBy={sortBy}
					onSortChange={(v) => {
						if (isValidSort(v)) setSortBy(v);
					}}
				/>
				{/* Products List - Virtualized for performance */}
				{displayProducts.length === 0 && !isFetching ? (
					<EmptyState
						entityType="products"
						isSearchResult={!!normalizedSearch}
					/>
				) : (
					<div
						className="relative px-4 py-4"
						style={{
							height: `${virtualizer.getTotalSize()}px`,
							width: "100%",
							position: "relative",
						}}
					>
						{/* Following TanStack Virtual dynamic example pattern for useWindowVirtualizer */}
						{virtualizer.getVirtualItems().map((virtualRow) => {
							const rowProducts = getProductsForRow(virtualRow.index);
							return (
								<div
									key={virtualRow.key}
									data-index={virtualRow.index}
									ref={virtualizer.measureElement}
									style={{
										position: "absolute",
										top: 0,
										left: 0,
										width: "100%",
										transform: `translateY(${virtualRow.start}px)`,
									}}
								>
									<div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 md:gap-3">
										{rowProducts.map((product) => (
											<ProductCard key={product.id} product={product} />
										))}
									</div>
								</div>
							);
						})}
						{/* Loading indicator for next page */}
						{isFetchingNextPage && (
							<div className="absolute top-0 left-0 w-full flex items-center justify-center p-8">
								<p className="text-muted-foreground">Загрузка...</p>
							</div>
						)}
					</div>
				)}
			</div>
		</>
	);
}
