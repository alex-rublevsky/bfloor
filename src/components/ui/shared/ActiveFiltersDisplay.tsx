import { useMemo } from "react";
import { X } from "~/components/ui/shared/Icon";
import type { Brand, CategoryWithCount, Collection } from "~/types";

interface AttributeFilter {
	attributeId: number;
	attributeName: string;
	values: Array<{ id: number; value: string; slug: string | null }>;
}

interface ActiveFiltersDisplayProps {
	categories: CategoryWithCount[];
	selectedCategory: string | null;
	brands: Brand[];
	selectedBrand: string | null;
	collections: Collection[];
	selectedCollection: string | null;
	attributeFilters: AttributeFilter[];
	selectedAttributeFilters: Record<number, string[]>;
	onRemoveBrand: () => void;
	onRemoveCollection: () => void;
	onRemoveAttributeValue: (attributeId: number, valueId: string) => void;
	// Dashboard-specific filters (optional)
	showUncategorizedOnly?: boolean;
	showWithoutBrandOnly?: boolean;
	showWithoutCollectionOnly?: boolean;
	onRemoveUncategorizedOnly?: () => void;
	onRemoveWithoutBrandOnly?: () => void;
	onRemoveWithoutCollectionOnly?: () => void;
}

/**
 * Reusable component to display active filters as pills with remove buttons
 * Used on both store page and dashboard products page
 */
export function ActiveFiltersDisplay({
	categories,
	selectedCategory,
	brands,
	selectedBrand,
	collections,
	selectedCollection,
	attributeFilters,
	selectedAttributeFilters,
	showUncategorizedOnly = false,
	showWithoutBrandOnly = false,
	showWithoutCollectionOnly = false,
	onRemoveBrand,
	onRemoveCollection,
	onRemoveAttributeValue,
	onRemoveUncategorizedOnly,
	onRemoveWithoutBrandOnly,
	onRemoveWithoutCollectionOnly,
}: ActiveFiltersDisplayProps) {
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

	// Get attribute filter pills with IDs for removal
	const attributePills = useMemo(() => {
		const pills: Array<{
			attributeId: number;
			attributeName: string;
			values: Array<{ id: string; name: string }>;
		}> = [];

		for (const [attributeIdStr, valueIds] of Object.entries(
			selectedAttributeFilters,
		)) {
			const attributeId = parseInt(attributeIdStr, 10);
			if (Number.isNaN(attributeId) || valueIds.length === 0) continue;

			const attributeFilter = attributeFilters.find(
				(af) => af.attributeId === attributeId,
			);
			if (!attributeFilter) continue;

			const values = valueIds
				.map((valueId) => {
					const value = attributeFilter.values.find(
						(v) => v.id.toString() === valueId || v.slug === valueId,
					);
					return value ? { id: valueId, name: value.value } : null;
				})
				.filter((v): v is { id: string; name: string } => v !== null);

			if (values.length > 0) {
				pills.push({
					attributeId,
					attributeName: attributeFilter.attributeName,
					values,
				});
			}
		}

		return pills;
	}, [attributeFilters, selectedAttributeFilters]);

	// Show skeleton for title if category is selected but name isn't loaded yet
	const showTitleSkeleton = selectedCategory && !categoryName;

	return (
		<div className="px-4 pt-6 pb-4">
			{/* Title */}
			{showTitleSkeleton ? (
				<div className="h-10 md:h-12 bg-muted animate-pulse rounded w-48 mb-3" />
			) : (
				<h1
					key={categoryName ?? "all"}
					className="text-2xl md:text-3xl font-semibold mb-3"
					style={{
						animation: "fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
					}}
				>
					{categoryName ?? "Все товары"}
				</h1>
			)}

			{/* Filter Pills */}
			{(brandName ||
				collectionName ||
				attributePills.length > 0 ||
				showUncategorizedOnly ||
				showWithoutBrandOnly ||
				showWithoutCollectionOnly) && (
				<div className="flex flex-wrap gap-2">
					{brandName && (
						<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-muted text-muted-foreground transition-all duration-200 hover:bg-muted/80">
							<span>{brandName}</span>
							<button
								type="button"
								onClick={onRemoveBrand}
								className="h-4 w-4 p-0 rounded-full hover:bg-background/50 transition-standard"
								aria-label={`Remove ${brandName} filter`}
							>
								<X
									size={14}
									className="text-muted-foreground hover:text-foreground"
								/>
							</button>
						</span>
					)}
					{collectionName && (
						<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-muted text-muted-foreground transition-all duration-200 hover:bg-muted/80">
							<span>{collectionName}</span>
							<button
								type="button"
								onClick={onRemoveCollection}
								className="h-4 w-4 p-0 rounded-full hover:bg-background/50 transition-standard"
								aria-label={`Remove ${collectionName} filter`}
							>
								<X
									size={14}
									className="text-muted-foreground hover:text-foreground"
								/>
							</button>
						</span>
					)}
					{showUncategorizedOnly && onRemoveUncategorizedOnly && (
						<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-muted text-muted-foreground transition-all duration-200 hover:bg-muted/80">
							<span>Без категории</span>
							<button
								type="button"
								onClick={onRemoveUncategorizedOnly}
								className="h-4 w-4 p-0 rounded-full hover:bg-background/50 transition-standard"
								aria-label="Remove uncategorized filter"
							>
								<X
									size={14}
									className="text-muted-foreground hover:text-foreground"
								/>
							</button>
						</span>
					)}
					{showWithoutBrandOnly && onRemoveWithoutBrandOnly && (
						<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-muted text-muted-foreground transition-all duration-200 hover:bg-muted/80">
							<span>Без бренда</span>
							<button
								type="button"
								onClick={onRemoveWithoutBrandOnly}
								className="h-4 w-4 p-0 rounded-full hover:bg-background/50 transition-standard"
								aria-label="Remove without brand filter"
							>
								<X
									size={14}
									className="text-muted-foreground hover:text-foreground"
								/>
							</button>
						</span>
					)}
					{showWithoutCollectionOnly && onRemoveWithoutCollectionOnly && (
						<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-muted text-muted-foreground transition-all duration-200 hover:bg-muted/80">
							<span>Без коллекции</span>
							<button
								type="button"
								onClick={onRemoveWithoutCollectionOnly}
								className="h-4 w-4 p-0 rounded-full hover:bg-background/50 transition-standard"
								aria-label="Remove without collection filter"
							>
								<X
									size={14}
									className="text-muted-foreground hover:text-foreground"
								/>
							</button>
						</span>
					)}
					{attributePills.map((pill) =>
						pill.values.map((value) => (
							<span
								key={`${pill.attributeId}-${value.id}`}
								className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-muted text-muted-foreground transition-all duration-200 hover:bg-muted/80"
							>
								<span>{value.name}</span>
								<button
									type="button"
									onClick={() =>
										onRemoveAttributeValue(pill.attributeId, value.id)
									}
									className="h-4 w-4 p-0 rounded-full hover:bg-background/50 transition-standard"
									aria-label={`Remove ${value.name} filter`}
								>
									<X
										size={14}
										className="text-muted-foreground hover:text-foreground"
									/>
								</button>
							</span>
						)),
					)}
				</div>
			)}
		</div>
	);
}
