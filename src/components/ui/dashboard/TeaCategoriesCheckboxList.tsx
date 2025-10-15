import { Checkbox } from "~/components/ui/shared/Checkbox";
import type { TeaCategory } from "~/types";

interface TeaCategoriesCheckboxListProps {
	/** Array of tea categories to display */
	teaCategories: TeaCategory[];
	/** Array of selected category slugs */
	selectedCategories: string[];
	/** Callback when category selection changes */
	onCategoryChange: (categories: string[]) => void;
	/** Optional: ID prefix for unique IDs */
	idPrefix?: string;
	/** Optional: Maximum height for scrollable container */
	maxHeight?: string;
}

/**
 * Reusable Tea Categories checkbox list with scrollable container
 * Used in blog forms and other dashboard forms
 */
export function TeaCategoriesCheckboxList({
	teaCategories,
	selectedCategories,
	onCategoryChange,
	idPrefix = "",
	maxHeight = "max-h-40",
}: TeaCategoriesCheckboxListProps) {
	const handleCheckChange = (categorySlug: string, checked: boolean) => {
		const newCategories = checked
			? [...selectedCategories, categorySlug]
			: selectedCategories.filter((slug) => slug !== categorySlug);
		onCategoryChange(newCategories);
	};

	return (
		<div>
			<div className="block text-sm font-medium mb-2">Tea Categories</div>
			<div
				className={`space-y-2 border border-input rounded-md p-3 ${maxHeight} overflow-y-auto`}
			>
				{teaCategories.map((category) => (
					<label
						key={category.slug}
						htmlFor={`${idPrefix}tea-category-${category.slug}`}
						className="flex items-center space-x-2 cursor-pointer"
					>
						<Checkbox
							id={`${idPrefix}tea-category-${category.slug}`}
							checked={selectedCategories.includes(category.slug)}
							onCheckedChange={(checked) => {
								handleCheckChange(category.slug, checked as boolean);
							}}
						/>
						<span>{category.name}</span>
					</label>
				))}
			</div>
		</div>
	);
}
