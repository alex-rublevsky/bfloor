import { memo, useCallback, useEffect, useId, useState } from "react";
import { DashboardFormDrawer } from "~/components/ui/dashboard/DashboardFormDrawer";
import { Button } from "~/components/ui/shared/Button";
import { Checkbox } from "~/components/ui/shared/Checkbox";
import {
	CheckboxList,
	type CheckboxListItem,
} from "~/components/ui/shared/CheckboxList";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/shared/Select";
import { Slider } from "~/components/ui/shared/Slider";
import { useDeviceType } from "~/hooks/use-mobile";
import type { AttributeFilter } from "~/server_functions/store/getAttributeValuesForFiltering";
import type { CategoryWithCount } from "~/types";

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
	attributeFilters?: AttributeFilter[];
	selectedAttributeFilters?: Record<number, string[]>; // attributeId -> array of value IDs (as strings)
	onAttributeFilterChange?: (attributeId: number, valueIds: string[]) => void;
	showUncategorizedOnly?: boolean;
	onShowUncategorizedOnlyChange?: (checked: boolean) => void;
	showWithoutBrandOnly?: boolean;
	onShowWithoutBrandOnlyChange?: (checked: boolean) => void;
	showWithoutCollectionOnly?: boolean;
	onShowWithoutCollectionOnlyChange?: (checked: boolean) => void;
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
	attributeFilters = [],
	selectedAttributeFilters = {},
	onAttributeFilterChange,
	showUncategorizedOnly = false,
	onShowUncategorizedOnlyChange,
	showWithoutBrandOnly = false,
	onShowWithoutBrandOnlyChange,
	showWithoutCollectionOnly = false,
	onShowWithoutCollectionOnlyChange,
}: ProductFiltersProps) {
	useDeviceType();
	// no masked backdrop needed in current layout
	const desktopSortId = useId();

	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const drawerFormId = useId();
	const uncategorizedCheckboxId = useId();
	const withoutBrandCheckboxId = useId();
	const withoutCollectionCheckboxId = useId();

	// Local state for filter values (only applied when "Apply" is clicked)
	const [localCategory, setLocalCategory] = useState<string | null>(
		selectedCategory,
	);
	const [localBrand, setLocalBrand] = useState<string | null>(selectedBrand);
	const [localCollection, setLocalCollection] = useState<string | null>(
		selectedCollection,
	);
	const [localPriceRange, setLocalPriceRange] =
		useState<[number, number]>(currentPriceRange);
	const [localSortBy, setLocalSortBy] = useState<string>(sortBy);
	const [localAttributeFilters, setLocalAttributeFilters] = useState<
		Record<number, string[]>
	>(selectedAttributeFilters);
	const [localShowUncategorizedOnly, setLocalShowUncategorizedOnly] =
		useState<boolean>(showUncategorizedOnly);
	const [localShowWithoutBrandOnly, setLocalShowWithoutBrandOnly] =
		useState<boolean>(showWithoutBrandOnly);
	const [localShowWithoutCollectionOnly, setLocalShowWithoutCollectionOnly] =
		useState<boolean>(showWithoutCollectionOnly);

	const handlePriceRangeChange = useCallback((newValue: number[]) => {
		const range: [number, number] = [newValue[0], newValue[1]];
		setLocalPriceRange(range);
	}, []);

	const handleMainCategoryChange = useCallback((category: string | null) => {
		setLocalCategory(category);
	}, []);

	const handleBrandChange = useCallback((brand: string | null) => {
		setLocalBrand(brand);
		// Clear without brand filter when selecting a brand
		setLocalShowWithoutBrandOnly((prev) => {
			if (brand && prev) {
				return false;
			}
			return prev;
		});
	}, []);

	const handleCollectionChange = useCallback((collection: string | null) => {
		setLocalCollection(collection);
		// Clear without collection filter when selecting a collection
		setLocalShowWithoutCollectionOnly((prev) => {
			if (collection && prev) {
				return false;
			}
			return prev;
		});
	}, []);

	// Sync local state with props when drawer opens or props change
	useEffect(() => {
		if (isDrawerOpen) {
			setLocalCategory(selectedCategory);
			setLocalBrand(selectedBrand);
			setLocalCollection(selectedCollection);
			setLocalPriceRange(currentPriceRange);
			setLocalSortBy(sortBy);
			setLocalAttributeFilters(selectedAttributeFilters);
			setLocalShowUncategorizedOnly(showUncategorizedOnly);
			setLocalShowWithoutBrandOnly(showWithoutBrandOnly);
			setLocalShowWithoutCollectionOnly(showWithoutCollectionOnly);
		}
	}, [
		isDrawerOpen,
		selectedCategory,
		selectedBrand,
		selectedCollection,
		currentPriceRange,
		sortBy,
		selectedAttributeFilters,
		showUncategorizedOnly,
		showWithoutBrandOnly,
		showWithoutCollectionOnly,
	]);

	const hasAnyActiveFilters =
		(localCategory && localCategory.length > 0) ||
		(localBrand && localBrand.length > 0) ||
		(localCollection && localCollection.length > 0) ||
		localPriceRange[0] !== priceRange.min ||
		localPriceRange[1] !== priceRange.max ||
		Object.keys(localAttributeFilters).length > 0 ||
		localShowUncategorizedOnly ||
		localShowWithoutBrandOnly ||
		localShowWithoutCollectionOnly;

	const resetAll = () => {
		setLocalCategory(null);
		setLocalBrand(null);
		setLocalCollection(null);
		setLocalPriceRange([priceRange.min, priceRange.max]);
		setLocalShowUncategorizedOnly(false);
		setLocalShowWithoutBrandOnly(false);
		setLocalShowWithoutCollectionOnly(false);
		// Reset all attribute filters
		setLocalAttributeFilters({});
	};

	const handleAttributeFilterChange = useCallback(
		(attributeId: number) => (valueIds: string[]) => {
			setLocalAttributeFilters((prev) => {
				const newFilters = { ...prev };
				if (valueIds.length === 0) {
					delete newFilters[attributeId];
				} else {
					newFilters[attributeId] = valueIds;
				}
				return newFilters;
			});
		},
		[],
	);

	const handleDrawerSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		// Apply all local filter values to the actual filters
		onCategoryChange(localCategory);
		onBrandChange?.(localBrand);
		onCollectionChange?.(localCollection);
		onPriceRangeChange?.(localPriceRange);
		onSortChange?.(localSortBy);
		onShowUncategorizedOnlyChange?.(localShowUncategorizedOnly);
		onShowWithoutBrandOnlyChange?.(localShowWithoutBrandOnly);
		onShowWithoutCollectionOnlyChange?.(localShowWithoutCollectionOnly);
		// Apply attribute filters
		if (onAttributeFilterChange) {
			// Collect all attribute IDs that need to be updated (from both current and local)
			const allAttributeIds = new Set<number>();
			for (const attr of attributeFilters) {
				allAttributeIds.add(attr.attributeId);
			}
			for (const attributeId of Object.keys(localAttributeFilters).map(
				Number,
			)) {
				allAttributeIds.add(attributeId);
			}
			// Update each attribute filter to match local state
			for (const attributeId of allAttributeIds) {
				const localValueIds = localAttributeFilters[attributeId] || [];
				const currentValueIds = selectedAttributeFilters[attributeId] || [];
				// Only update if the values have changed
				if (
					localValueIds.length !== currentValueIds.length ||
					!localValueIds.every((id) => currentValueIds.includes(id))
				) {
					onAttributeFilterChange(attributeId, localValueIds);
				}
			}
		}
		setIsDrawerOpen(false);
	};

	const handleDrawerCancel = () => {
		// Reset local state to match current props when canceling
		setLocalCategory(selectedCategory);
		setLocalBrand(selectedBrand);
		setLocalCollection(selectedCollection);
		setLocalPriceRange(currentPriceRange);
		setLocalSortBy(sortBy);
		setLocalAttributeFilters(selectedAttributeFilters);
		setLocalShowUncategorizedOnly(showUncategorizedOnly);
		setLocalShowWithoutBrandOnly(showWithoutBrandOnly);
		setLocalShowWithoutCollectionOnly(showWithoutCollectionOnly);
		setIsDrawerOpen(false);
	};

	// Render filter content (shared between desktop and mobile)
	const renderFilterContent = () => {
		// Collect all filter sections to display in flex layout
		const filterSections = [];

		// Sort filter
		filterSections.push(
			<div key="sort" className="min-w-fit">
				<div className="text-sm font-medium mb-2">Сортировка</div>
				<Select value={localSortBy} onValueChange={setLocalSortBy}>
					<SelectTrigger
						id={desktopSortId}
						className="text-xs font-normal field-sizing-content"
					>
						<SelectValue placeholder="Выберите сортировку" />
					</SelectTrigger>
					<SelectContent className="bg-background text-xs font-normal">
						<SelectItem className="text-xs font-normal" value="relevant">
							По релевантности
						</SelectItem>
						<SelectItem className="text-xs font-normal" value="price-asc">
							Сначала дешёвые
						</SelectItem>
						<SelectItem className="text-xs font-normal" value="price-desc">
							Сначала дорогие
						</SelectItem>
						<SelectItem className="text-xs font-normal" value="newest">
							Сначала новые
						</SelectItem>
					</SelectContent>
				</Select>
			</div>,
		);

		// Price range filter
		filterSections.push(
			<div key="price" className="min-w-fit">
				<Slider
					value={localPriceRange}
					min={priceRange.min}
					max={priceRange.max}
					step={1}
					onValueChange={handlePriceRangeChange}
					showTooltip
					tooltipContent={(value) => `${value} р`}
					label="Цена"
				/>
			</div>,
		);

		// Categories filter
		filterSections.push(
			<div key="categories" className="min-w-fit">
				<div className="flex items-center justify-between mb-2">
					<div className="text-sm font-medium">Категории</div>
					{/* Show only uncategorized checkbox */}
					{onShowUncategorizedOnlyChange && (
						<label
							htmlFor={uncategorizedCheckboxId}
							className="flex items-center space-x-1.5 cursor-pointer"
						>
							<Checkbox
								id={uncategorizedCheckboxId}
								checked={localShowUncategorizedOnly}
								onCheckedChange={(checked) => {
									setLocalShowUncategorizedOnly(!!checked);
									// Clear category selection when enabling uncategorized filter
									if (checked) {
										setLocalCategory(null);
									}
								}}
							/>
							<span className="text-sm">без</span>
						</label>
					)}
				</div>
				<CheckboxList
					items={categories.map((cat) => ({
						id: cat.slug,
						label: cat.name,
					}))}
					selectedIds={localCategory ? [localCategory] : []}
					onItemChange={(itemId, checked) => {
						// Single-select behavior: if checked, select this one; if unchecked, clear selection
						const categorySlug = checked ? String(itemId) : null;
						handleMainCategoryChange(categorySlug);
						// Clear uncategorized filter when selecting a category
						if (categorySlug && localShowUncategorizedOnly) {
							setLocalShowUncategorizedOnly(false);
						}
					}}
					idPrefix="filter-category"
					scrollable={true}
					maxHeight="200px"
				/>
			</div>,
		);

		// Brands filter
		if (brands.length > 0) {
			filterSections.push(
				<div key="brands" className="min-w-fit">
					<div className="flex items-center justify-between mb-2">
						<div className="text-sm font-medium">Бренды</div>
						{/* Show only without brand checkbox */}
						{onShowWithoutBrandOnlyChange && (
							<label
								htmlFor={withoutBrandCheckboxId}
								className="flex items-center space-x-1.5 cursor-pointer"
							>
								<Checkbox
									id={withoutBrandCheckboxId}
									checked={localShowWithoutBrandOnly}
									onCheckedChange={(checked) => {
										setLocalShowWithoutBrandOnly(!!checked);
										// Clear brand selection when enabling without brand filter
										if (checked) {
											setLocalBrand(null);
										}
									}}
								/>
								<span className="text-sm">без</span>
							</label>
						)}
					</div>
					<CheckboxList
						items={brands.map((brand) => ({
							id: brand.slug,
							label: brand.name,
						}))}
						selectedIds={localBrand ? [localBrand] : []}
						onItemChange={(itemId, checked) => {
							// Single-select behavior: if checked, select this one; if unchecked, clear selection
							const brandSlug = checked ? String(itemId) : null;
							handleBrandChange(brandSlug);
						}}
						idPrefix="filter-brand"
						scrollable={true}
						maxHeight="200px"
					/>
				</div>,
			);
		}

		// Collections filter
		if (collections.length > 0) {
			filterSections.push(
				<div key="collections" className="min-w-fit">
					<div className="flex items-center justify-between mb-2">
						<div className="text-sm font-medium">Коллекции</div>
						{/* Show only without collection checkbox */}
						{onShowWithoutCollectionOnlyChange && (
							<label
								htmlFor={withoutCollectionCheckboxId}
								className="flex items-center space-x-1.5 cursor-pointer"
							>
								<Checkbox
									id={withoutCollectionCheckboxId}
									checked={localShowWithoutCollectionOnly}
									onCheckedChange={(checked) => {
										setLocalShowWithoutCollectionOnly(!!checked);
										// Clear collection selection when enabling without collection filter
										if (checked) {
											setLocalCollection(null);
										}
									}}
								/>
								<span className="text-sm">без</span>
							</label>
						)}
					</div>
					<CheckboxList
						items={collections.map((collection) => ({
							id: collection.slug,
							label: collection.name,
						}))}
						selectedIds={localCollection ? [localCollection] : []}
						onItemChange={(itemId, checked) => {
							// Single-select behavior: if checked, select this one; if unchecked, clear selection
							const collectionSlug = checked ? String(itemId) : null;
							handleCollectionChange(collectionSlug);
						}}
						idPrefix="filter-collection"
						scrollable={true}
						maxHeight="200px"
					/>
				</div>,
			);
		}

		// Attribute filters
		attributeFilters.forEach((attrFilter) => {
			const selectedValueIds =
				localAttributeFilters[attrFilter.attributeId] || [];
			// Convert to CheckboxList format
			const checkboxItems: CheckboxListItem[] = attrFilter.values.map((v) => ({
				id: v.id.toString(),
				label: v.value,
			}));

			const handleAttributeItemChange = (
				itemId: string | number,
				checked: boolean,
			) => {
				const currentSelection = selectedValueIds;
				const newSelection = checked
					? [...currentSelection, itemId.toString()]
					: currentSelection.filter((id) => id !== itemId.toString());
				handleAttributeFilterChange(attrFilter.attributeId)(newSelection);
			};

			filterSections.push(
				<div key={`attr-${attrFilter.attributeId}`} className="min-w-fit">
					<div className="text-sm font-medium mb-2">
						{attrFilter.attributeName}
					</div>
					<CheckboxList
						items={checkboxItems}
						selectedIds={selectedValueIds}
						onItemChange={handleAttributeItemChange}
						idPrefix={`filter-attr-${attrFilter.attributeId}`}
						scrollable={true}
						maxHeight="200px"
					/>
				</div>,
			);
		});

		return (
			<div className="space-y-4">
				{/* Filters in flex row with wrap and space-between */}
				<div className="flex flex-row flex-wrap justify-between gap-x-4 gap-y-4">
					{filterSections}
				</div>
			</div>
		);
	};

	return (
		<>
			{/* Filters button - desktop and mobile */}
			<Button
				size="sm"
				onClick={() => setIsDrawerOpen(true)}
				className="fixed left-2 md:left-1/2 md:-translate-x-1/2 bottom-22 md:bottom-4 z-[100] inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-3 py-2 text-xs shadow-md"
				aria-label="Открыть фильтры"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="currentColor"
					className="w-4 h-4"
					aria-hidden="true"
					role="img"
				>
					<path
						fillRule="evenodd"
						d="M3 5.25A.75.75 0 0 1 3.75 4.5h16.5a.75.75 0 0 1 .53 1.28l-6.03 6.03v4.94a.75.75 0 0 1-1.06.67l-3-1.5a.75.75 0 0 1-.41-.67v-3.44L3.22 5.78A.75.75 0 0 1 3 5.25Z"
						clipRule="evenodd"
					/>
				</svg>
				Фильтры
			</Button>

			{/* Drawer using DashboardFormDrawer */}
			<DashboardFormDrawer
				isOpen={isDrawerOpen}
				onOpenChange={setIsDrawerOpen}
				title=""
				formId={drawerFormId}
				isSubmitting={false}
				submitButtonText="Применить"
				submittingText="Применение..."
				onCancel={handleDrawerCancel}
				layout="single-column"
				footerActions={
					hasAnyActiveFilters ? (
						<Button type="button" variant="accent" size="sm" onClick={resetAll}>
							Сбросить все фильтры
						</Button>
					) : (
						<span className="text-lg font-semibold leading-none tracking-tight">
							Фильтры
						</span>
					)
				}
			>
				<form onSubmit={handleDrawerSubmit} id={drawerFormId}>
					{renderFilterContent()}
				</form>
			</DashboardFormDrawer>
		</>
	);
});

export default ProductFilters;
