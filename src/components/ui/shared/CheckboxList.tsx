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
	showOnlyActive?: boolean; // Filter to show only active items
	scrollable?: boolean; // Enable scrollable container with limited height
	maxHeight?: string; // Max height for scrollable container (default: "200px")
}

export function CheckboxList({
	items,
	selectedIds,
	onItemChange,
	idPrefix,
	showOnlyActive = false,
	scrollable = false,
	maxHeight = "200px",
}: CheckboxListProps) {
	// Filter items if needed
	const filteredItems = showOnlyActive
		? items.filter((item) => item.isActive !== false)
		: items;

	const content = (
		<div className="grid grid-cols-1 gap-0 w-fit">
			{filteredItems.map((item) => {
				const isChecked = selectedIds.includes(item.id);

				return (
					<label
						key={item.id}
						htmlFor={`${idPrefix}-${item.id}`}
						className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-muted transition-colors"
					>
						<Checkbox
							id={`${idPrefix}-${item.id}`}
							name={`${idPrefix}-${item.id}`}
							checked={isChecked}
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
				);
			})}
		</div>
	);

	if (scrollable) {
		return (
			<div className="overflow-y-auto pr-2 w-fit" style={{ maxHeight }}>
				{content}
			</div>
		);
	}

	return content;
}
