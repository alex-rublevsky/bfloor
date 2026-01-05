import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
	createFileRoute,
	stripSearchParams,
	useElementScrollRestoration,
} from "@tanstack/react-router";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { zodValidator } from "@tanstack/zod-adapter";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { EmptyState } from "~/components/ui/shared/EmptyState";
import ProductCard from "~/components/ui/store/ProductCard";
import ProductFilters from "~/components/ui/store/ProductFilters";
import { StorePageSkeleton } from "~/components/ui/store/skeletons/StorePageSkeleton";
import { useClientSearch } from "~/lib/clientSearchContext";
import {
	attributeValuesForFilteringQueryOptions,
	brandsQueryOptions,
	categoriesQueryOptions,
	collectionsQueryOptions,
	storeDataInfiniteQueryOptions,
} from "~/lib/queryOptions.ts";
import type { AttributeFilter } from "~/server_functions/store/getAttributeValuesForFiltering";
import type { Brand, CategoryWithCount, Collection } from "~/types";
import { seo } from "~/utils/seo";

// Zod schema for search params validation (without uncategorized filters for store page)
const searchParamsSchema = z.object({
	category: z.string().optional(),
	brand: z.string().optional(),
	collection: z.string().optional(),
	attributeFilters: z.string().optional(), // JSON string of Record<number, string[]>
	sort: z
		.enum(["relevant", "name", "price-asc", "price-desc", "newest", "oldest"])
		.optional(),
});

// Default values for search params (used for stripping defaults from URL)
const defaultSearchValues = {
	sort: "relevant" as const,
};

export const Route = createFileRoute("/store/")({
	component: StorePage,
	validateSearch: zodValidator(searchParamsSchema),
	// Strip default values from URL to keep it clean
	search: {
		middlewares: [stripSearchParams(defaultSearchValues)],
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
	// Initialize with safe SSR default (2 columns for mobile-first)
	const [columnsPerRow, setColumnsPerRow] = useState(() => {
		if (typeof window === "undefined") return 2;
		const width = window.innerWidth;
		if (width >= 1536) return 6; // 2xl
		if (width >= 1280) return 5; // xl
		if (width >= 1024) return 4; // lg
		if (width >= 768) return 3; // md
		return 2; // sm and below
	});

	useEffect(() => {
		// Only run on client side
		if (typeof window === "undefined") return;

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

		// Update on resize
		window.addEventListener("resize", updateColumns);
		return () => window.removeEventListener("resize", updateColumns);
	}, []);

	return columnsPerRow;
}

// Component to display active filters as pills
function ActiveFiltersDisplay({
	categories,
	selectedCategory,
	brands,
	selectedBrand,
	collections,
	selectedCollection,
	attributeFilters,
	selectedAttributeFilters,
}: {
	categories: CategoryWithCount[];
	selectedCategory: string | null;
	brands: Brand[];
	selectedBrand: string | null;
	collections: Collection[];
	selectedCollection: string | null;
	attributeFilters: AttributeFilter[];
	selectedAttributeFilters: Record<number, string[]>;
}) {
	// Get category name
	const categoryName = useMemo(() => {
		if (!selectedCategory) return null;
		const category = categories.find((c) => c.slug === selectedCategory);
		return category?.name ?? null;
	}, [categories, selectedCategory]);

	// Get brand name
	const brandName = useMemo(() => {
		if (!selectedBrand) return null;
		const brand = brands.find((b) => b.slug === selectedBrand);
		return brand?.name ?? null;
	}, [brands, selectedBrand]);

	// Get collection name
	const collectionName = useMemo(() => {
		if (!selectedCollection) return null;
		const collection = collections.find((c) => c.slug === selectedCollection);
		return collection?.name ?? null;
	}, [collections, selectedCollection]);

	// Get attribute filter pills
	const attributePills = useMemo(() => {
		const pills: Array<{ attributeName: string; valueNames: string[] }> = [];

		for (const [attributeIdStr, valueIds] of Object.entries(
			selectedAttributeFilters,
		)) {
			const attributeId = parseInt(attributeIdStr, 10);
			if (Number.isNaN(attributeId) || valueIds.length === 0) continue;

			const attributeFilter = attributeFilters.find(
				(af) => af.attributeId === attributeId,
			);
			if (!attributeFilter) continue;

			const valueNames = valueIds
				.map((valueId) => {
					const value = attributeFilter.values.find(
						(v) => v.id.toString() === valueId || v.slug === valueId,
					);
					return value?.value ?? null;
				})
				.filter((name): name is string => name !== null);

			if (valueNames.length > 0) {
				pills.push({
					attributeName: attributeFilter.attributeName,
					valueNames,
				});
			}
		}

		return pills;
	}, [attributeFilters, selectedAttributeFilters]);

	return (
		<div className="px-4 pt-6 pb-4">
			{/* Title */}
			<h1 className="text-2xl md:text-3xl font-semibold mb-3">
				{categoryName ?? "Все товары"}
			</h1>

			{/* Filter Pills */}
			{(brandName || collectionName || attributePills.length > 0) && (
				<div className="flex flex-wrap gap-2">
					{brandName && (
						<span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-muted text-muted-foreground">
							{brandName}
						</span>
					)}
					{collectionName && (
						<span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-muted text-muted-foreground">
							{collectionName}
						</span>
					)}
					{attributePills.map((pill) =>
						pill.valueNames.map((valueName, idx) => (
							<span
								key={`${pill.attributeName}-${valueName}-${idx}`}
								className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-muted text-muted-foreground"
							>
								{valueName}
							</span>
						)),
					)}
				</div>
			)}
		</div>
	);
}

// Cache for virtualizer measurements - persists across navigations
const measurementCache = new Map<string, number>();

function StorePage() {
	const containerRef = useRef<HTMLDivElement>(null);
	const columnsPerRow = useResponsiveColumns();

	// Get search params from URL using TanStack Router
	const searchParams = Route.useSearch();
	const navigate = Route.useNavigate();

	// Get search term from context (same as dashboard)
	const clientSearch = useClientSearch();
	const normalizedSearch = useMemo(() => {
		const value =
			typeof clientSearch.searchTerm === "string"
				? clientSearch.searchTerm
				: "";
		const trimmed = value.trim().replace(/\s+/g, " ");
		return trimmed.length >= 2 ? trimmed : undefined;
	}, [clientSearch.searchTerm]);

	// Parse attribute filters from URL
	const parseAttributeFilters = useCallback(
		(attrFiltersStr?: string): Record<number, string[]> => {
			if (!attrFiltersStr) return {};
			try {
				const parsed = JSON.parse(attrFiltersStr);
				if (typeof parsed === "object" && parsed !== null) {
					// Convert string keys to numbers
					const result: Record<number, string[]> = {};
					for (const [key, value] of Object.entries(parsed)) {
						const numKey = parseInt(key, 10);
						if (!Number.isNaN(numKey) && Array.isArray(value)) {
							result[numKey] = value.map(String);
						}
					}
					return result;
				}
			} catch {
				// Invalid JSON, return empty object
			}
			return {};
		},
		[],
	);

	// Initialize filter state from URL search params
	const [selectedCategory, setSelectedCategory] = useState<string | null>(
		searchParams.category ?? null,
	);
	const [selectedBrand, setSelectedBrand] = useState<string | null>(
		searchParams.brand ?? null,
	);
	const [selectedCollection, setSelectedCollection] = useState<string | null>(
		searchParams.collection ?? null,
	);
	const [selectedAttributeFilters, setSelectedAttributeFilters] = useState<
		Record<number, string[]>
	>(parseAttributeFilters(searchParams.attributeFilters));
	const [sortBy, setSortBy] = useState<
		"relevant" | "name" | "price-asc" | "price-desc" | "newest" | "oldest"
	>(searchParams.sort ?? "relevant");
	const [currentPriceRange, setCurrentPriceRange] = useState<[number, number]>([
		0, 1000000,
	]);

	// Sync state with URL when search params change (e.g., from browser back/forward)
	useEffect(() => {
		setSelectedCategory(searchParams.category ?? null);
		setSelectedBrand(searchParams.brand ?? null);
		setSelectedCollection(searchParams.collection ?? null);
		setSelectedAttributeFilters(
			parseAttributeFilters(searchParams.attributeFilters),
		);
		setSortBy(searchParams.sort ?? "relevant");
	}, [
		searchParams.category,
		searchParams.brand,
		searchParams.collection,
		searchParams.attributeFilters,
		searchParams.sort,
		parseAttributeFilters,
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

	// Update URL when filters change - using functional form as recommended by TanStack Router
	const updateCategory = (category: string | null) => {
		setSelectedCategory(category);
		navigate({
			search: (prev) => ({
				...prev,
				category: category ?? undefined,
			}),
			replace: true,
		});
	};

	const updateBrand = (brand: string | null) => {
		setSelectedBrand(brand);
		navigate({
			search: (prev) => ({
				...prev,
				brand: brand ?? undefined,
			}),
			replace: true,
		});
	};

	const updateCollection = (collection: string | null) => {
		setSelectedCollection(collection);
		navigate({
			search: (prev) => ({
				...prev,
				collection: collection ?? undefined,
			}),
			replace: true,
		});
	};

	const updateSort = (sort: typeof sortBy) => {
		setSortBy(sort);
		navigate({
			search: (prev) => ({
				...prev,
				sort: sort !== "relevant" ? sort : undefined,
			}),
			replace: true,
		});
	};

	const updateAttributeFilter = (attributeId: number, valueIds: string[]) => {
		const newFilters = { ...selectedAttributeFilters };
		if (valueIds.length === 0) {
			delete newFilters[attributeId];
		} else {
			newFilters[attributeId] = valueIds;
		}
		setSelectedAttributeFilters(newFilters);

		// Update URL using functional form
		const filtersStr =
			Object.keys(newFilters).length > 0
				? JSON.stringify(newFilters)
				: undefined;
		navigate({
			search: (prev) => ({
				...prev,
				attributeFilters: filtersStr,
			}),
			replace: true,
		});
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
			attributeFilters: selectedAttributeFilters,
			sort: sortBy,
		}),
		// Preserve previous data while new search/filters load
		placeholderData: (prev) => prev,
	});

	// Fetch attribute filters based on current filters (including attribute filters)
	// This ensures only values available in the current filtered product set are shown
	const { data: attributeFilters = [] } = useQuery({
		...attributeValuesForFilteringQueryOptions(
			selectedCategory ?? undefined,
			selectedBrand ?? undefined,
			selectedCollection ?? undefined,
			selectedAttributeFilters,
		),
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

	// Memoize transformed data to avoid recalculating on every render
	const categoriesWithCount = useMemo(
		() =>
			categories.map(
				(c): CategoryWithCount => ({
					...c,
					count: 0,
				}),
			),
		[categories],
	);

	const brandsForFilters = useMemo(
		() => brands.map((b: Brand) => ({ slug: b.slug, name: b.name })),
		[brands],
	);

	const collectionsForFilters = useMemo(
		() =>
			collections.map((co: Collection) => ({ slug: co.slug, name: co.name })),
		[collections],
	);

	// Merge products from all pages (same as dashboard)
	const products = useMemo(
		() =>
			storeData?.pages
				?.flatMap((page) => page?.products ?? [])
				?.filter(Boolean) ?? [],
		[storeData?.pages],
	);

	// Apply price range filter client-side (not supported server-side)
	const displayProducts = useMemo(() => {
		if (currentPriceRange[0] === 0 && currentPriceRange[1] === 1000000) {
			// No price filter applied
			return products;
		}
		return products.filter((product) => {
			const price = product.price || 0;
			return price >= currentPriceRange[0] && price <= currentPriceRange[1];
		});
	}, [products, currentPriceRange]);

	// Scroll restoration for virtualized list
	// Following TanStack Router docs: https://tanstack.com/router/v1/docs/framework/react/guide/scroll-restoration#manual-scroll-restoration
	const scrollEntry = useElementScrollRestoration({
		getElement: () => (typeof window !== "undefined" ? window : null),
	});

	// Virtualizer configuration - responsive columns based on screen size
	// Following TanStack Virtual dynamic example pattern: https://tanstack.com/virtual/latest/docs/framework/react/examples/dynamic
	const itemHeight = 365;
	const rowCount = Math.ceil(displayProducts.length / columnsPerRow);

	// Create a stable cache key based on current filters and search
	const cacheKey = useMemo(() => {
		return JSON.stringify({
			search: normalizedSearch,
			category: selectedCategory,
			brand: selectedBrand,
			collection: selectedCollection,
			attributeFilters: selectedAttributeFilters,
			sort: sortBy,
			columnsPerRow,
		});
	}, [
		normalizedSearch,
		selectedCategory,
		selectedBrand,
		selectedCollection,
		selectedAttributeFilters,
		sortBy,
		columnsPerRow,
	]);

	const virtualizer = useWindowVirtualizer({
		count: rowCount,
		estimateSize: useCallback(
			(index: number) => {
				// Try to get cached measurement first
				const cached = measurementCache.get(`${cacheKey}-${index}`);
				return cached ?? itemHeight;
			},
			[cacheKey],
		),
		overscan: 8,
		initialOffset: scrollEntry?.scrollY,
		measureElement: useCallback(
			(element: Element, entry: ResizeObserverEntry | undefined) => {
				const index = element.getAttribute("data-index");
				if (index === null) return itemHeight;

				// Get the actual height
				const height =
					entry?.borderBoxSize?.[0]?.blockSize ??
					element.getBoundingClientRect().height;

				// Cache the measurement
				measurementCache.set(`${cacheKey}-${index}`, height);

				return height;
			},
			[cacheKey],
		),
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
					categories={categoriesWithCount}
					selectedCategory={selectedCategory}
					onCategoryChange={updateCategory}
					brands={brandsForFilters}
					selectedBrand={selectedBrand}
					onBrandChange={updateBrand}
					collections={collectionsForFilters}
					selectedCollection={selectedCollection}
					onCollectionChange={updateCollection}
					priceRange={{ min: 0, max: 1000000 }}
					currentPriceRange={currentPriceRange}
					onPriceRangeChange={setCurrentPriceRange}
					sortBy={sortBy}
					onSortChange={(v) => {
						if (isValidSort(v)) updateSort(v);
					}}
					attributeFilters={attributeFilters}
					selectedAttributeFilters={selectedAttributeFilters}
					onAttributeFilterChange={updateAttributeFilter}
				/>
				{/* Active Filters Display */}
				<ActiveFiltersDisplay
					categories={categoriesWithCount}
					selectedCategory={selectedCategory}
					brands={brands}
					selectedBrand={selectedBrand}
					collections={collections}
					selectedCollection={selectedCollection}
					attributeFilters={attributeFilters}
					selectedAttributeFilters={selectedAttributeFilters}
				/>
				{/* Products List - Virtualized for performance */}
				{displayProducts.length === 0 && !isFetching ? (
					<EmptyState
						entityType="products"
						isSearchResult={!!normalizedSearch}
					/>
				) : (
					<>
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
						</div>
						{/* Loading indicator for next page */}
						{isFetchingNextPage && (
							<div className="w-full flex items-center justify-center p-8">
								<p className="text-muted-foreground">Загрузка...</p>
							</div>
						)}
					</>
				)}
			</div>
		</>
	);
}
