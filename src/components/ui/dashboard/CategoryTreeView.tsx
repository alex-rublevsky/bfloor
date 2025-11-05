import { Edit, Trash2 } from "lucide-react";
import { Badge } from "~/components/ui/shared/Badge";
import { Button } from "~/components/ui/shared/Button";
import { EmptyState } from "~/components/ui/shared/EmptyState";
import type { Category, CategoryTreeNode } from "~/types";

interface CategoryTreeViewProps {
	tree: CategoryTreeNode[];
	onEdit: (category: Category) => void;
	onDelete: (category: Category) => void;
}

// Render a parent category with all its children as a group
function CategoryGroup({
	node,
	onEdit,
	onDelete,
}: {
	node: CategoryTreeNode;
	onEdit: (category: Category) => void;
	onDelete: (category: Category) => void;
}) {
	return (
		<>
			{/* Parent Category */}
			<div className="group flex items-center space-x-2 p-2 rounded-md hover:bg-muted transition-colors border border-transparent hover:border-border">
				<div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex-shrink-0">
					<Button
						size="sm"
						variant="outline"
						onClick={() => onEdit(node)}
						className="w-8 h-8 p-0"
					>
						<Edit className="w-4 h-4" />
					</Button>
					<Button
						size="sm"
						variant="destructive"
						onClick={() => onDelete(node)}
						className="w-8 h-8 p-0"
					>
						<Trash2 className="w-4 h-4" />
					</Button>
				</div>
				<div className="flex flex-col flex-1 min-w-0">
					<div className="flex items-center gap-2">
						<span className="text-sm font-medium truncate">{node.name}</span>
						{!node.isActive && (
							<Badge variant="secondary" className="text-xs flex-shrink-0">
								Inactive
							</Badge>
						)}
					</div>
					<span className="text-xs text-muted-foreground truncate">
						{node.slug}
					</span>
				</div>
			</div>

			{/* Child Categories - shown in sub-grid immediately after parent */}
			{node.children.length > 0 && (
				<div className="col-span-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 ml-4 mt-2 mb-2">
					{node.children.map((child) => (
						<div
							key={child.id}
							className="group flex items-center space-x-2 p-2 rounded-md hover:bg-muted transition-colors border border-transparent hover:border-border"
						>
							<div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex-shrink-0">
								<Button
									size="sm"
									variant="outline"
									onClick={() => onEdit(child)}
									className="w-8 h-8 p-0"
								>
									<Edit className="w-4 h-4" />
								</Button>
								<Button
									size="sm"
									variant="destructive"
									onClick={() => onDelete(child)}
									className="w-8 h-8 p-0"
								>
									<Trash2 className="w-4 h-4" />
								</Button>
							</div>
							<div className="flex flex-col flex-1 min-w-0">
								<div className="flex items-center gap-2">
									<span className="text-muted-foreground flex-shrink-0">
										└─
									</span>
									<span className="text-sm font-medium truncate">
										{child.name}
									</span>
									{!child.isActive && (
										<Badge
											variant="secondary"
											className="text-xs flex-shrink-0"
										>
											Inactive
										</Badge>
									)}
								</div>
								<span className="text-xs text-muted-foreground truncate">
									{child.slug}
								</span>
							</div>
						</div>
					))}
				</div>
			)}
		</>
	);
}

export function CategoryTreeView({
	tree,
	onEdit,
	onDelete,
}: CategoryTreeViewProps) {
	if (tree.length === 0) {
		return <EmptyState entityType="categories" />;
	}

	return (
		<div className="border border-border rounded-lg p-4 bg-transparent">
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
				{tree.map((node) => (
					<CategoryGroup
						key={node.id}
						node={node}
						onEdit={onEdit}
						onDelete={onDelete}
					/>
				))}
			</div>
		</div>
	);
}
