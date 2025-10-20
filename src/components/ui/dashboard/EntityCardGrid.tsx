import { Edit, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/shared/Button";
import { cn } from "~/lib/utils";

// Meta component that provides the exact look and feel of the categories page
export interface EntityCardProps<T> {
	entity: T;
	onEdit: (entity: T) => void;
	onDelete: (entity: T) => void;
	children: React.ReactNode; // Entity-specific content
}

export function EntityCard<T>({
	entity,
	onEdit,
	onDelete,
	children,
}: EntityCardProps<T>) {
	return (
		<div
			className={cn(
				"group flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50 transition-colors cursor-pointer",
				"border border-transparent hover:border-border",
			)}
		>
			{/* Action Buttons - Icon only - Always visible on mobile/tablet, hover on desktop */}
			<div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex-shrink-0">
				<Button
					size="sm"
					variant="outline"
					onClick={(e) => {
						e.stopPropagation();
						onEdit(entity);
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
						onDelete(entity);
					}}
					className="w-8 h-8 p-0"
				>
					<Trash2 className="w-4 h-4" />
				</Button>
			</div>

			{/* Entity-specific content */}
			{children}
		</div>
	);
}

export interface EntityCardGridProps<T> {
	entities: T[];
	onEdit: (entity: T) => void;
	onDelete: (entity: T) => void;
	renderEntity: (entity: T) => React.ReactNode;
}

export function EntityCardGrid<T>({
	entities,
	onEdit,
	onDelete,
	renderEntity,
}: EntityCardGridProps<T>) {
	return (
		<div className="border rounded-lg p-4 bg-card">
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
				{entities.map((entity) => (
					<EntityCard
						key={JSON.stringify(entity)}
						entity={entity}
						onEdit={onEdit}
						onDelete={onDelete}
					>
						{renderEntity(entity)}
					</EntityCard>
				))}
			</div>
		</div>
	);
}
