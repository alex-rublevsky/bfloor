import { Edit, Trash2 } from "lucide-react";
import { Badge } from "~/components/ui/shared/Badge";
import { Button } from "~/components/ui/shared/Button";
import { EmptyState } from "~/components/ui/shared/EmptyState";
import { cn } from "~/lib/utils";
import type { Category, CategoryTreeNode } from "~/types";

interface CategoryTreeViewProps {
	tree: CategoryTreeNode[];
	onEdit: (category: Category) => void;
	onDelete: (category: Category) => void;
}

export function CategoryTreeView({
	tree,
	onEdit,
	onDelete,
}: CategoryTreeViewProps) {
	// Flatten the tree structure for grid display
	const flattenTree = (nodes: CategoryTreeNode[]): CategoryTreeNode[] => {
		const result: CategoryTreeNode[] = [];
		const traverse = (node: CategoryTreeNode) => {
			result.push(node);
			node.children.forEach(traverse);
		};
		nodes.forEach(traverse);
		return result;
	};

	const flatCategories = flattenTree(tree);

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
			{flatCategories.length === 0 ? (
				<EmptyState entityType="categories" />
			) : (
				flatCategories.map((category) => (
					<CategoryGridItem
						key={category.slug}
						category={category}
						onEdit={onEdit}
						onDelete={onDelete}
					/>
				))
			)}
		</div>
	);
}

interface CategoryGridItemProps {
	category: CategoryTreeNode;
	onEdit: (category: Category) => void;
	onDelete: (category: Category) => void;
}

function CategoryGridItem({
	category,
	onEdit,
	onDelete,
}: CategoryGridItemProps) {
	return (
		<div
			className={cn(
				"group flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50 transition-colors cursor-pointer",
				"border border-transparent hover:border-border"
			)}
		>
			{/* Action Buttons - Icon only */}
			<div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
				<Button 
					size="sm" 
					variant="outline" 
					onClick={(e) => {
						e.stopPropagation();
						onEdit(category);
					}}
					className="w-8 h-8 p-0"
				>
					<Edit className="w-4 h-4" />
				</Button>
				<Button
					size="sm"
					variant="destructive"
					onClick={(e) => {
						e.stopPropagation();
						onDelete(category);
					}}
					className="w-8 h-8 p-0"
				>
					<Trash2 className="w-4 h-4" />
				</Button>
			</div>

			{/* Category Info */}
			<div className="flex flex-col flex-1 min-w-0">
				<div className="flex items-center gap-2">
					<span className="text-sm font-medium truncate">{category.name}</span>
					{category.depth > 0 && (
						<Badge variant="outline" className="text-xs flex-shrink-0">
							Level {category.depth + 1}
						</Badge>
					)}
					{!category.isActive && (
						<Badge variant="secondary" className="text-xs flex-shrink-0">
							Inactive
						</Badge>
					)}
				</div>
				<span className="text-xs text-muted-foreground truncate">
					{category.slug}
				</span>
			</div>
		</div>
	);
}
