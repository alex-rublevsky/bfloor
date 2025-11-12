import { Loader2 } from "lucide-react";
import { Badge } from "~/components/ui/shared/Badge";

export interface EntityCardContentProps {
	name: string;
	slug?: string;
	isActive?: boolean;
	secondaryInfo?: string; // Optional line like "Родитель: ..." or "Бренд: ..." or code
	icon?: React.ReactNode; // Optional icon/flag to show before the content
	inactiveLabel?: string; // Custom label for inactive badge (default: "Неактивна")
	count?: number | null; // Optional count to display (null means loading)
	tags?: Array<{ id: number; value: string }>; // Optional tags/standardized values to display
	maxTags?: number; // Maximum number of tags to show before showing "+X" (default: 5)
}

/**
 * Reusable component for displaying entity information in a horizontal card layout.
 * Used in categories, collections, countries, and attributes pages.
 */
export function EntityCardContent({
	name,
	slug,
	isActive = true,
	secondaryInfo,
	icon,
	inactiveLabel = "Неактивна",
	count,
	tags,
	maxTags = 5,
}: EntityCardContentProps) {
	return (
		<>
			{/* Optional Icon (e.g., country flag) */}
			{icon && <div className="flex-shrink-0">{icon}</div>}

			{/* Entity Info */}
			<div className="flex flex-col flex-1 min-w-0 gap-0.5">
				<div className="flex items-center gap-2">
					<span className="text-sm font-medium truncate">{name}</span>
					{count === null ? (
						<span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded flex items-center gap-1">
							<Loader2 className="w-3 h-3 animate-spin" />
						</span>
					) : count !== undefined && count > 0 ? (
						<span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
							{count}
						</span>
					) : null}
					{!isActive && (
						<Badge variant="secondary" className="text-xs flex-shrink-0">
							{inactiveLabel}
						</Badge>
					)}
				</div>
				{secondaryInfo && (
					<span className="text-xs text-muted-foreground truncate">
						{secondaryInfo}
					</span>
				)}
				{slug && (
					<span className="text-xs text-muted-foreground truncate">{slug}</span>
				)}
				{/* Show standardized values as pills if they exist */}
				{tags && tags.length > 0 && (
					<div className="flex flex-wrap gap-1 mt-2">
						{tags.slice(0, maxTags).map((tag) => (
							<span
								key={tag.id}
								className="text-[10px] leading-tight px-1.5 py-0.5 rounded bg-muted text-primary border border-primary font-medium"
								title={tag.value}
							>
								{tag.value}
							</span>
						))}
						{tags.length > maxTags && (
							<span className="text-[10px] leading-tight px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
								+{tags.length - maxTags}
							</span>
						)}
					</div>
				)}
			</div>
		</>
	);
}
