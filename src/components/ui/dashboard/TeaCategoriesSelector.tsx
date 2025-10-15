import { Checkbox } from "~/components/ui/shared/Checkbox";
import type { TeaCategory } from "~/types";

interface TeaCategoriesSelectorProps {
	teaCategories: TeaCategory[];
	selectedCategories: string[];
	onCategoryChange: (categorySlug: string, checked: boolean) => void;
	idPrefix: "edit" | "add" | "create";
}

export function TeaCategoriesSelector({
	teaCategories,
	selectedCategories,
	onCategoryChange,
	idPrefix,
}: TeaCategoriesSelectorProps) {
	return (
		<fieldset>
			<legend className="text-lg font-medium mb-4">Tea Categories</legend>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{teaCategories.map((category) => (
					<label
						key={category.slug}
						htmlFor={`${idPrefix}-tea-category-${category.slug}`}
						className="flex items-center space-x-2 cursor-pointer"
					>
						<Checkbox
							id={`${idPrefix}-tea-category-${category.slug}`}
							name={`teaCategory-${category.slug}`}
							checked={selectedCategories?.includes(category.slug) || false}
							onCheckedChange={(checked) => {
								onCategoryChange(category.slug, !!checked);
							}}
						/>
						<span className="text-sm">{category.name}</span>
					</label>
				))}
			</div>
		</fieldset>
	);
}
