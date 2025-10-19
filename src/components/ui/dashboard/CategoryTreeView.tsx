import { Badge } from "~/components/ui/shared/Badge";
import { EmptyState } from "~/components/ui/shared/EmptyState";
import { EntityCardGrid } from "~/components/ui/dashboard/EntityCardGrid";
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

	if (flatCategories.length === 0) {
		return <EmptyState entityType="categories" />;
	}

	return (
		<EntityCardGrid
			entities={flatCategories}
			onEdit={onEdit}
			onDelete={onDelete}
			renderEntity={(category) => (
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
			)}
		/>
	);
}
