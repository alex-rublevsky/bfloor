import * as React from "react";
import { cn } from "~/lib/utils";

// Meta component that provides the exact look and feel of the categories page
export interface EntityCardProps<T> {
	entity: T;
	onEdit: (entity: T) => void;
	children: React.ReactNode; // Entity-specific content
	mode?: "horizontal" | "vertical"; // Display mode
}

export function EntityCard<T>({
	entity,
	onEdit,
	children,
	mode = "horizontal",
}: EntityCardProps<T>) {
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			onEdit(entity);
		}
	};

	// Check if children is a vertical layout (has flex-col class) or mode is vertical
	const isVerticalLayout =
		mode === "vertical" ||
		(React.isValidElement(children) &&
			children.props !== null &&
			typeof children.props === "object" &&
			"className" in children.props &&
			typeof children.props.className === "string" &&
			children.props.className.includes("flex-col"));

	return (
		<button
			type="button"
			onClick={() => onEdit(entity)}
			onKeyDown={handleKeyDown}
			style={{ transition: "var(--transition-standard)" }}
			className={cn(
				isVerticalLayout
					? "group flex flex-col p-0 cursor-pointer border-none w-auto text-left bg-transparent"
					: "group flex items-center space-x-2 p-2 rounded-md hover:bg-muted cursor-pointer border border-transparent hover:border-border w-full text-left bg-transparent",
			)}
		>
			{/* Entity-specific content */}
			{children}

			{/* Hover indicator - Edit text on the right (only for horizontal layout) */}
			{!isVerticalLayout && (
				<div
					className="opacity-0 md:group-hover:opacity-100 flex-shrink-0 text-sm text-muted-foreground"
					style={{ transition: "var(--transition-standard)" }}
				>
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
	mode?: "horizontal" | "vertical"; // Display mode: horizontal (countries) or vertical (brands)
}

export function EntityCardGrid<T>({
	entities,
	onEdit,
	renderEntity,
	gridClassName = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3",
	mode = "horizontal", // Default to horizontal for backward compatibility
}: EntityCardGridProps<T>) {
	return (
		<div className="border border-border rounded-lg p-4 bg-transparent">
			<div className={gridClassName}>
				{entities.map((entity) => (
					<EntityCard
						key={JSON.stringify(entity)}
						entity={entity}
						onEdit={onEdit}
						mode={mode}
					>
						{renderEntity(entity)}
					</EntityCard>
				))}
			</div>
		</div>
	);
}
