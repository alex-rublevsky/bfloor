import * as React from "react";
import { cn } from "~/lib/utils";

// Meta component that provides the exact look and feel of the categories page
export interface EntityCardProps<T> {
	entity: T;
	onEdit: (entity: T) => void;
	children: React.ReactNode; // Entity-specific content
}

export function EntityCard<T>({
	entity,
	onEdit,
	children,
}: EntityCardProps<T>) {
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			onEdit(entity);
		}
	};

	// Check if children is a vertical layout (has flex-col class)
	const isVerticalLayout =
		React.isValidElement(children) &&
		children.props !== null &&
		typeof children.props === "object" &&
		"className" in children.props &&
		typeof children.props.className === "string" &&
		children.props.className.includes("flex-col");

	return (
		<button
			type="button"
			onClick={() => onEdit(entity)}
			onKeyDown={handleKeyDown}
			className={cn(
				isVerticalLayout
					? "group flex flex-col p-2 rounded-md hover:bg-muted transition-[var(--transition-standard)] cursor-pointer border border-transparent hover:border-border w-auto text-left bg-transparent"
					: "group flex items-center space-x-2 p-2 rounded-md hover:bg-muted transition-[var(--transition-standard)] cursor-pointer border border-transparent hover:border-border w-full text-left bg-transparent",
			)}
		>
			{/* Entity-specific content */}
			{children}

			{/* Hover indicator - Edit text on the right (only for horizontal layout) */}
			{!isVerticalLayout && (
				<div className="opacity-0 md:group-hover:opacity-100 transition-[var(--transition-standard)] flex-shrink-0 text-sm text-muted-foreground">
					Редактировать
				</div>
			)}
		</button>
	);
}

export interface EntityCardGridProps<T> {
	entities: T[];
	onEdit: (entity: T) => void;
	renderEntity: (entity: T) => React.ReactNode;
	gridClassName?: string; // Optional custom grid classes
}

export function EntityCardGrid<T>({
	entities,
	onEdit,
	renderEntity,
	gridClassName = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3",
}: EntityCardGridProps<T>) {
	return (
		<div className="border border-border rounded-lg p-4 bg-transparent">
			<div className={gridClassName}>
				{entities.map((entity) => (
					<EntityCard
						key={JSON.stringify(entity)}
						entity={entity}
						onEdit={onEdit}
					>
						{renderEntity(entity)}
					</EntityCard>
				))}
			</div>
		</div>
	);
}
