import { ChevronDown, ChevronRight, Folder, FolderOpen } from "lucide-react";
import { useState } from "react";
import { Badge } from "~/components/ui/shared/Badge";
import { Button } from "~/components/ui/shared/Button";
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
	const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

	const toggleExpanded = (slug: string) => {
		setExpandedIds((prev) => {
			const next = new Set(prev);
			if (next.has(slug)) {
				next.delete(slug);
			} else {
				next.add(slug);
			}
			return next;
		});
	};

	const renderTreeNode = (node: CategoryTreeNode) => {
		const isExpanded = expandedIds.has(node.slug);
		const hasChildren = node.children.length > 0;

		return (
			<div key={node.slug}>
				<CategoryTreeItem
					category={node}
					isExpanded={isExpanded}
					hasChildren={hasChildren}
					onToggle={() => toggleExpanded(node.slug)}
					onEdit={onEdit}
					onDelete={onDelete}
				/>
				{hasChildren && isExpanded && (
					<div className="ml-6 border-l-2 border-muted pl-4 mt-1 space-y-1">
						{node.children.map((child) => renderTreeNode(child))}
					</div>
				)}
			</div>
		);
	};

	return (
		<div className="space-y-1">
			{tree.length === 0 ? (
				<div className="text-center py-8 text-muted-foreground">
					No categories yet. Create one to get started!
				</div>
			) : (
				tree.map((node) => renderTreeNode(node))
			)}
		</div>
	);
}

interface CategoryTreeItemProps {
	category: CategoryTreeNode;
	isExpanded: boolean;
	hasChildren: boolean;
	onToggle: () => void;
	onEdit: (category: Category) => void;
	onDelete: (category: Category) => void;
}

function CategoryTreeItem({
	category,
	isExpanded,
	hasChildren,
	onToggle,
	onEdit,
	onDelete,
}: CategoryTreeItemProps) {
	return (
		<div
			className={cn(
				"group flex items-center gap-2 p-2 rounded-md transition-all",
				"border-2 border-transparent hover:border-border hover:bg-muted/50",
			)}
			data-category-slug={category.slug}
		>
			{/* Expand/Collapse Button */}
			<button
				type="button"
				onClick={onToggle}
				className={cn(
					"w-5 h-5 flex items-center justify-center rounded hover:bg-muted transition-colors flex-shrink-0",
					!hasChildren && "invisible",
				)}
			>
				{hasChildren &&
					(isExpanded ? (
						<ChevronDown className="h-4 w-4" />
					) : (
						<ChevronRight className="h-4 w-4" />
					))}
			</button>

			{/* Folder Icon */}
			{hasChildren ? (
				isExpanded ? (
					<FolderOpen className="h-4 w-4 text-primary flex-shrink-0" />
				) : (
					<Folder className="h-4 w-4 text-muted-foreground flex-shrink-0" />
				)
			) : (
				<div className="h-4 w-4 rounded bg-muted flex-shrink-0" />
			)}

			{/* Category Info */}
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2">
					<span className="font-medium truncate">{category.name}</span>
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
				<div className="text-sm text-muted-foreground truncate">
					{category.slug}
				</div>
			</div>

			{/* Action Buttons */}
			<div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
				<Button size="sm" variant="outline" onClick={() => onEdit(category)}>
					Edit
				</Button>
				<Button
					size="sm"
					variant="destructive"
					onClick={() => onDelete(category)}
				>
					Delete
				</Button>
			</div>
		</div>
	);
}
