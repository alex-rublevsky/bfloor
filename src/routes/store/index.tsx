import { useInfiniteQuery } from "@tanstack/react-query";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useId, useMemo, useRef, useState, useLayoutEffect } from "react";
import ProductCard from "~/components/ui/store/ProductCard";
import { StorePageSkeleton } from "~/components/ui/store/skeletons/StorePageSkeleton";
import { useClientSearch } from "~/lib/clientSearchContext";
import { storeDataInfiniteQueryOptions } from "~/lib/queryOptions.ts";
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
		window.addEventListener('resize', updateColumns);
		return () => window.removeEventListener('resize', updateColumns);
    }, []);

	return columnsPerRow;
}

function StorePage() {
	const storeScrollId = useId();
	const parentRef = useRef<HTMLDivElement>(null);
	const columnsPerRow = useResponsiveColumns();
	
	// Get search term from context
	const clientSearch = useClientSearch();
	
	// Get store data with infinite query (products only)
	const { 
		data: storeData, 
		isLoading: isLoadingProducts, 
		fetchNextPage, 
		hasNextPage, 
		isFetchingNextPage 
	} = useInfiniteQuery({
		...storeDataInfiniteQueryOptions(),
	});

	// Merge products from all pages (same as dashboard)
	const allProducts = storeData?.pages?.flatMap((page) => page?.products ?? [])?.filter(Boolean) ?? [];
	
	// Apply search filtering
	const filteredProducts = useMemo(() => {
		if (!clientSearch.searchTerm.trim()) {
			return allProducts;
		}
		
		const searchTerm = clientSearch.searchTerm.toLowerCase().trim();
		return allProducts.filter((product) => {
			const nameMatch = product.name.toLowerCase().includes(searchTerm);
			const skuMatch = product.sku?.toLowerCase().includes(searchTerm);
			const descriptionMatch = product.description?.toLowerCase().includes(searchTerm);
			return nameMatch || skuMatch || descriptionMatch;
		});
	}, [allProducts, clientSearch.searchTerm]);
	
	// Apply sorting (same logic as StoreFeed had)
	const sortedProducts = useMemo(() => {
		if (!filteredProducts.length) return [];
		
		return [...filteredProducts].sort((a, b) => {
			const categoryOrder = {
				tea: 1,
				apparel: 2,
				posters: 3,
				stickers: 4,
				produce: 5,
			};

			const aCategoryOrder =
				categoryOrder[a.categorySlug as keyof typeof categoryOrder] || 999;
			const bCategoryOrder =
				categoryOrder[b.categorySlug as keyof typeof categoryOrder] || 999;

			if (aCategoryOrder !== bCategoryOrder) {
				return aCategoryOrder - bCategoryOrder;
			}

			// Final fallback: Sort alphabetically by name
			return a.name.localeCompare(b.name);
		});
	}, [filteredProducts]);

	// Virtualizer configuration - responsive columns based on screen size
    const itemHeight = 365;
    // Fixed row gap in px between virtual rows
    const rowGapPx = 16;
	const rowCount = Math.ceil(sortedProducts.length / columnsPerRow);

	// Use container scroll (same as dashboard)
    const virtualizer = useVirtualizer({
		count: rowCount,
		getScrollElement: () => parentRef.current,
        estimateSize: () => itemHeight,
		overscan: 8, // Render extra rows for smooth scrolling and pre-fetching
	});

	// Re-measure rows when the number of columns changes
    useLayoutEffect(() => {
        virtualizer.measure();
    }, [virtualizer]);

	// Re-measure on container width changes
    // Avoid remeasuring on every width change; only remeasure when columnsPerRow changes

	// Infinite scroll - load more products when user scrolls near the end (IDENTICAL to dashboard)
	const virtualItems = virtualizer.getVirtualItems();
	useEffect(() => {
		const lastItem = virtualItems[virtualItems.length - 1];
		
		// Don't fetch if already fetching, no next page, or no items rendered
		if (!lastItem || !hasNextPage || isFetchingNextPage) return;
		
		// Fetch next page when user scrolls near the end
		// lastItem.index is the row index, rowCount is total rows
		// Trigger when within 15 rows of the end (prefetch for smooth scrolling)
		const threshold = rowCount - 8;
		
		if (lastItem.index >= threshold) {
			fetchNextPage();
		}
	}, [virtualItems, hasNextPage, isFetchingNextPage, rowCount, fetchNextPage]);

	// Helper function to get products for a specific row
	const getProductsForRow = (rowIndex: number) => {
		const startIndex = rowIndex * columnsPerRow;
		const endIndex = Math.min(startIndex + columnsPerRow, sortedProducts.length);
		return sortedProducts.slice(startIndex, endIndex);
	};
	
	// Show skeleton only on initial load (not when fetching next pages)
	if (isLoadingProducts || !storeData) {
		return <StorePageSkeleton />;
	}

	return (
		<div className="h-screen bg-background flex flex-col">
			<main className="flex-1 overflow-hidden">
				<div id={storeScrollId} ref={parentRef} className="overflow-auto overscroll-contain px-0 py-4 h-full">
                    <div className="relative" style={{ height: `${virtualizer.getTotalSize() + rowCount * rowGapPx}px` }}>
						{virtualizer.getVirtualItems().map((virtualRow) => {
							const rowProducts = getProductsForRow(virtualRow.index);
							return (
                                <div
									key={virtualRow.key}
									data-index={virtualRow.index}
									ref={virtualizer.measureElement}
									className="absolute top-0 left-0 w-full"
                                style={{
                                minHeight: `${virtualRow.size}px`,
                                transform: `translate3d(0, ${Math.round(virtualRow.start + virtualRow.index * rowGapPx)}px, 0)`,
                                willChange: 'transform',
                                contain: 'layout paint',
                            }}
								>
                                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-[16px]">
										{rowProducts.map((product) => (
											<ProductCard key={product.id} product={product} />
										))}
									</div>
								</div>
							);
						})}
						{/* Loading indicator for next page */}
						{isFetchingNextPage && (
							<div className="w-full flex items-center justify-center p-8" style={{ transform: `translateY(${virtualizer.getTotalSize()}px)` }}>
								<p className="text-muted-foreground">Загрузка...</p>
							</div>
						)}
					</div>
				</div>
			</main>
		</div>
	);
}
