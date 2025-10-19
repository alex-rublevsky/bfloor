import { Checkbox } from "~/components/ui/shared/Checkbox";

export interface CheckboxListItem {
	id: string | number;
	label: string;
	description?: string;
	isActive?: boolean; // For filtering inactive items
}

interface CheckboxListProps {
	items: CheckboxListItem[];
	selectedIds: (string | number)[];
	onItemChange: (itemId: string | number, checked: boolean) => void;
	idPrefix: string;
	columns?: 1 | 2; // Number of columns
	showOnlyActive?: boolean; // Filter to show only active items
}

export function CheckboxList({
	items,
	selectedIds,
	onItemChange,
	idPrefix,
	columns = 2,
	showOnlyActive = false,
}: CheckboxListProps) {
	// Filter items if needed
	const filteredItems = showOnlyActive 
		? items.filter(item => item.isActive !== false)
		: items;

	// Determine grid columns
	const gridCols = columns === 1 ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2";

	return (
		<div className={`grid ${gridCols} gap-3`}>
			{filteredItems.map((item) => (
				<label
					key={item.id}
					htmlFor={`${idPrefix}-${item.id}`}
					className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-gray-50 transition-colors"
				>
					<Checkbox
						id={`${idPrefix}-${item.id}`}
						name={`${idPrefix}-${item.id}`}
						checked={selectedIds.includes(item.id)}
						onCheckedChange={(checked) => {
							onItemChange(item.id, !!checked);
						}}
					/>
					<div className="flex flex-col">
						<span className="text-sm font-medium">{item.label}</span>
						{item.description && (
							<span className="text-xs text-muted-foreground">
								{item.description}
							</span>
						)}
					</div>
				</label>
			))}
		</div>
	);
}

