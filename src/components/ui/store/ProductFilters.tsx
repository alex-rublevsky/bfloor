import { memo, useCallback, useEffect, useId, useRef, useState } from "react";
import { useScrollLock } from "~/hooks/useScrollLock";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/shared/Select";
import { Slider } from "~/components/ui/shared/Slider";
import { useDeviceType } from "~/hooks/use-mobile";
import type { CategoryWithCount } from "~/types";
import { FilterGroup } from "../shared/FilterGroup";
// styles removed for current implementation
import { Drawer, DrawerBody, DrawerContent } from "~/components/ui/shared/Drawer";
import { Button } from "~/components/ui/shared/Button";

interface ProductFiltersProps {
    categories: CategoryWithCount[];
    selectedCategory: string | null;
    onCategoryChange: (category: string | null) => void;
    brands?: { slug: string; name: string }[];
    selectedBrand?: string | null;
    onBrandChange?: (brand: string | null) => void;
    collections?: { slug: string; name: string }[];
    selectedCollection?: string | null;
    onCollectionChange?: (collection: string | null) => void;
    priceRange: {
        min: number;
        max: number;
    };
    currentPriceRange: [number, number];
    onPriceRangeChange?: (range: [number, number]) => void;
    sortBy?: string;
    onSortChange?: (sort: string) => void;
}

const ProductFilters = memo(function ProductFilters({
    categories,
    selectedCategory,
    onCategoryChange,
    brands = [],
    selectedBrand = null,
    onBrandChange,
    collections = [],
    selectedCollection = null,
    onCollectionChange,
    priceRange,
    currentPriceRange,
    onPriceRangeChange,
    sortBy = "relevant",
    onSortChange,
}: ProductFiltersProps) {
    useDeviceType();
    // no masked backdrop needed in current layout
    const desktopSortId = useId();

    const handlePriceRangeChange = useCallback(
        (newValue: number[]) => {
            const range: [number, number] = [newValue[0], newValue[1]];
            onPriceRangeChange?.(range);
        },
        [onPriceRangeChange],
    );

    const handleMainCategoryChange = useCallback(
        (category: string | null) => {
            onCategoryChange(category);
        },
        [onCategoryChange],
    );

    const handleBrandChange = useCallback(
        (brand: string | null) => {
            onBrandChange?.(brand);
        },
        [onBrandChange],
    );

    const handleCollectionChange = useCallback(
        (collection: string | null) => {
            onCollectionChange?.(collection);
        },
        [onCollectionChange],
    );

    const splitIntoRows = <T,>(items: T[], rows: number) => {
        const buckets: T[][] = Array.from({ length: rows }, () => []);
        items.forEach((item, idx) => {
            buckets[idx % rows].push(item);
        });
        return buckets;
    };

    const [mobileOpen, setMobileOpen] = useState(false);
    const handleRef = useRef<HTMLButtonElement>(null);
    const resetRef = useRef<HTMLButtonElement>(null);
    const resetWrapperRef = useRef<HTMLDivElement>(null);
    const [resetLeft, setResetLeft] = useState<number | null>(null);
    const hasAnyActiveFilters =
        (selectedCategory && selectedCategory.length > 0) ||
        (selectedBrand && selectedBrand.length > 0) ||
        (selectedCollection && selectedCollection.length > 0) ||
        currentPriceRange[0] !== priceRange.min ||
        currentPriceRange[1] !== priceRange.max;

    useEffect(() => {
        const measure = () => {
            const handleEl = handleRef.current;
            const hRect = handleEl?.getBoundingClientRect();
            const rRect = resetRef.current?.getBoundingClientRect();
            if (hRect && rRect) {
                const gap = 8; // px spacing between reset and handle
                const left = Math.max(8, hRect.left - gap - rRect.width);
                setResetLeft(left);
            }
        };
        measure();
        window.addEventListener("resize", measure);
        let ro: ResizeObserver | null = null;
        let mo: MutationObserver | null = null;
        if (typeof ResizeObserver !== "undefined") {
            ro = new ResizeObserver(() => measure());
            if (handleRef.current) ro.observe(handleRef.current);
            if (resetRef.current) ro.observe(resetRef.current);
        }
        if (typeof MutationObserver !== "undefined") {
            mo = new MutationObserver(() => measure());
            if (resetWrapperRef.current) {
                mo.observe(resetWrapperRef.current, { childList: true, subtree: true });
            } else if (document.body) {
                mo.observe(document.body, { childList: true, subtree: true });
            }
        }
        return () => {
            window.removeEventListener("resize", measure);
            ro?.disconnect();
            mo?.disconnect();
        };
    }, []);

    const resetAll = () => {
        onCategoryChange(null);
        onBrandChange?.(null);
        onCollectionChange?.(null);
        onPriceRangeChange?.([priceRange.min, priceRange.max]);
    };

    // Track hover state for desktop to lock scroll while panel is open
    const [isDesktopHovering, setIsDesktopHovering] = useState(false);
    const hoverTimeoutRef = useRef<number | null>(null);
    const handleMouseEnter = () => {
        if (hoverTimeoutRef.current) {
            window.clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
        setIsDesktopHovering(true);
    };
    const handleMouseLeave = () => {
        if (hoverTimeoutRef.current) window.clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = window.setTimeout(() => setIsDesktopHovering(false), 120);
    };
    useEffect(() => () => { if (hoverTimeoutRef.current) window.clearTimeout(hoverTimeoutRef.current); }, []);

    // Lock scroll when desktop panel is open (hovered)
    useScrollLock(isDesktopHovering);

    // Left-side drawer panel (column layout), no scroll-based behavior
    return (
        <>
        {/* Desktop reset button anchored to center, offset dynamically to avoid overlap */}
        <div
            ref={resetWrapperRef}
            className="hidden md:block fixed bottom-2 z-[30]"
            style={{ left: resetLeft ?? -9999 }}
        >
            {hasAnyActiveFilters && (
                <Button
                    variant="accent"
                    size="sm"
                    ref={resetRef}
                    onClick={resetAll}
                >
                    Сбросить
                </Button>
            )}
        </div>

        <div className="hidden md:block fixed left-0 right-0 bottom-0 z-[35] group pointer-events-none">
            {/* Backdrop blur for entire window during menu hover/open (sits below handle and panel) */}
            <div className="fixed inset-0 z-[30] opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm md:backdrop-blur-md bg-background/0 pointer-events-none" />
            {/* Wrapper anchors at bottom; handle sits above the panel's top edge */}
            <div className="pointer-events-none relative left-0 right-0 bottom-0 w-full">
                {/* Center anchor to keep Filters button perfectly centered at all times */}
                <div className="absolute left-1/2 -translate-x-1/2 bottom-2 pointer-events-none z-[36]">
                     {/* Filters handle - perfectly centered */}
                     <Button
                         ref={handleRef}
                         size="sm"
                         
                         aria-label="Фильтры"
                         className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-3 py-2 text-xs shadow-md outline-none focus:outline-none focus-visible:outline-none ring-0 focus-visible:ring-0 transition-opacity duration-200 group-hover:opacity-0"
                         onMouseEnter={handleMouseEnter}
                         onMouseLeave={handleMouseLeave}
                     >
                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden="true" role="img">
                             <path fillRule="evenodd" d="M3 5.25A.75.75 0 0 1 3.75 4.5h16.5a.75.75 0 0 1 .53 1.28l-6.03 6.03v4.94a.75.75 0 0 1-1.06.67l-3-1.5a.75.75 0 0 1-.41-.67v-3.44L3.22 5.78A.75.75 0 0 1 3 5.25Z" clipRule="evenodd" />
                         </svg>
                         Фильтры
                     </Button>
                 </div>
            </div>

            {/* Panel - fully hidden when collapsed; slides up on hover - positioned directly as fixed child */}
            <section className="pointer-events-auto fixed left-0 right-0 bottom-0 w-screen transform-gpu translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-[cubic-bezier(0.215,0.61,0.355,1)] z-[36]" aria-label="Фильтры продуктов" tabIndex={-1} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} style={{ margin: 0, padding: 0 }}>
                <div className="w-full h-full border-t border-border bg-background/87 backdrop-blur-sm shadow-2xl" style={{ margin: 0 }}>
                    <div className="mx-auto w-full max-w-[1600px] px-4 py-4">
                        <div className="grid grid-cols-2 gap-6">
                            {/* Categories - horizontal 3-row scroller */}
                            <div>
                                <div className="text-sm font-medium mb-2">Категории</div>
                                <div className="overflow-x-auto overflow-y-hidden pr-1">
                                    <div className="space-y-1 w-max">
                                        {splitIntoRows(categories, 3).map((row, i) => (
                                            <div key={`d-cat-row-${i}-${row.length}`}>
                                                <FilterGroup title={undefined} options={row} selectedOptions={selectedCategory} onOptionChange={handleMainCategoryChange} noWrap showAllOption={false} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Brands - horizontal 3-row scroller */}
                            <div>
                                <div className="text-sm font-medium mb-2">Бренды</div>
                                <div className="overflow-x-auto overflow-y-hidden pr-1">
                                    <div className="space-y-1 w-max">
                                        {splitIntoRows(brands, 3).map((row, i) => (
                                            <div key={`d-brand-row-${i}-${row.length}`}>
                                                <FilterGroup title={undefined} options={row} selectedOptions={selectedBrand} onOptionChange={handleBrandChange} noWrap showAllOption={false} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Collections - horizontal 3-row scroller */}
                            <div>
                                <div className="text-sm font-medium mb-2">Коллекции</div>
                                <div className="overflow-x-auto overflow-y-hidden pr-1">
                                    <div className="space-y-1 w-max">
                                        {splitIntoRows(collections, 3).map((row, i) => (
                                            <div key={`d-col-row-${i}-${row.length}`}>
                                                <FilterGroup title={undefined} options={row} selectedOptions={selectedCollection} onOptionChange={handleCollectionChange} noWrap showAllOption={false} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Sort and Price stacked */}
                            <div className="flex flex-col gap-4 min-w-0">
                                <div>
                                    <div className="text-sm font-medium mb-2">Сортировка</div>
                                    <Select value={sortBy} onValueChange={onSortChange}>
                                        <SelectTrigger id={desktopSortId} className="text-xs font-normal">
                                            <SelectValue placeholder="Выберите сортировку" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-background text-xs font-normal">
                                            <SelectItem className="text-xs font-normal" value="relevant">По релевантности</SelectItem>
                                            <SelectItem className="text-xs font-normal" value="price-asc">Сначала дешёвые</SelectItem>
                                            <SelectItem className="text-xs font-normal" value="price-desc">Сначала дорогие</SelectItem>
                                            <SelectItem className="text-xs font-normal" value="newest">Сначала новые</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Slider
                                        value={currentPriceRange}
                                        min={priceRange.min}
                                        max={priceRange.max}
                                        step={1}
                                        onValueChange={handlePriceRangeChange}
                                        showTooltip
                                        tooltipContent={(value) => `${value} р`}
                                        label="Диапазон цен"
                                        valueDisplay={<output className="text-sm font-medium tabular-nums">{`${currentPriceRange[0]} р - ${currentPriceRange[1]} р`}</output>}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    </div>
                </section>
        </div>

        {/* Mobile bottom sheet */}
        <div className="md:hidden">
            <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="fixed left-4 bottom-20 z-[45] inline-flex items-center gap-2 rounded-full border border-border bg-primary text-primary-foreground px-3 py-2 text-xs shadow-md"
                aria-label="Открыть фильтры"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden="true" role="img">
                    <path fillRule="evenodd" d="M3 5.25A.75.75 0 0 1 3.75 4.5h16.5a.75.75 0 0 1 .53 1.28l-6.03 6.03v4.94a.75.75 0 0 1-1.06.67l-3-1.5a.75.75 0 0 1-.41-.67v-3.44L3.22 5.78A.75.75 0 0 1 3 5.25Z" clipRule="evenodd" />
                </svg>
                Фильтры
            </button>

            <Drawer open={mobileOpen} onOpenChange={setMobileOpen}>
                <DrawerContent className="max-h-[95dvh]">
                    <DrawerBody className="p-4">
                        {/* Same content but full-width on mobile */}
                        <div className="space-y-4">
                            {/* Global reset (mobile) */}
                            {hasAnyActiveFilters && (
                                <div>
                                    <Button type="button" variant="accent" size="sm" onClick={resetAll}>
                                        Сбросить все фильтры
                                    </Button>
                                </div>
                            )}
                            {/* Categories */}
                            <div className="space-y-2">
                                <div className="text-sm font-medium">Категории</div>
                                <div className="overflow-x-auto overflow-y-hidden pr-1">
                                    <div className="space-y-1 w-max">
                                        {splitIntoRows(categories, 3).map((row, i) => (
                                            <div key={`cat-row-${i}-${row.length}`} className="">
                                                <FilterGroup
                                                    title={undefined}
                                                    options={row}
                                                    selectedOptions={selectedCategory}
                                                    onOptionChange={handleMainCategoryChange}
                                                    noWrap
                                                    showAllOption={false}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Brands */}
                            {brands.length > 0 && (
                                <div className="space-y-2">
                                    <div className="text-sm font-medium">Бренды</div>
                                    <div className="overflow-x-auto overflow-y-hidden pr-1">
                                        <div className="space-y-1 w-max">
                                            {splitIntoRows(brands, 3).map((row, i) => (
                                                <div key={`brand-row-${i}-${row.length}`}>
                                                    <FilterGroup
                                                        title={undefined}
                                                        options={row}
                                                        selectedOptions={selectedBrand}
                                                        onOptionChange={handleBrandChange}
                                                        noWrap
                                                        showAllOption={false}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Collections */}
                            {collections.length > 0 && (
                                <div className="space-y-2">
                                    <div className="text-sm font-medium">Коллекции</div>
                                    <div className="overflow-x-auto overflow-y-hidden pr-1">
                                        <div className="space-y-1 w-max">
                                            {splitIntoRows(collections, 3).map((row, i) => (
                                                <div key={`col-row-${i}-${row.length}`}>
                                                    <FilterGroup
                                                        title={undefined}
                                                        options={row}
                                                        selectedOptions={selectedCollection}
                                                        onOptionChange={handleCollectionChange}
                                                        noWrap
                                                        showAllOption={false}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Price and Sort */}
                            <Slider
                                value={currentPriceRange}
                                min={priceRange.min}
                                max={priceRange.max}
                                step={1}
                                onValueChange={handlePriceRangeChange}
                                showTooltip
                                tooltipContent={(value) => `${value} р`}
                                label="Диапазон цен"
                                valueDisplay={<output className="text-sm font-medium tabular-nums">{`${currentPriceRange[0]} р - ${currentPriceRange[1]} р`}</output>}
                            />

                            <div className="flex flex-col gap-2">
                                <label htmlFor={desktopSortId} className="text-sm font-medium text-foreground">Сортировка</label>
                                <Select value={sortBy} onValueChange={onSortChange}>
                                    <SelectTrigger id={desktopSortId} className="text-xs font-normal">
                                        <SelectValue placeholder="Выберите сортировку" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-background text-xs font-normal">
                                        <SelectItem className="text-xs font-normal" value="relevant">По релевантности</SelectItem>
                                        <SelectItem className="text-xs font-normal" value="price-asc">Сначала дешёвые</SelectItem>
                                        <SelectItem className="text-xs font-normal" value="price-desc">Сначала дорогие</SelectItem>
                                        <SelectItem className="text-xs font-normal" value="newest">Сначала новые</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </DrawerBody>
                </DrawerContent>
            </Drawer>
        </div>
        </>
    );
});

export default ProductFilters;
