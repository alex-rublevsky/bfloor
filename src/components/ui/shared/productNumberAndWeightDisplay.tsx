import { Leaf, Package } from "lucide-react";
import { useProductStats } from "~/hooks/useSelectProductInfo";
import { cn } from "~/lib/utils";

interface ProductStatsDisplayProps {
	className?: string;
}

/**
 * Component that displays total products count and tea weight
 * Uses TanStack Query's select option for efficient calculation
 */
export function ProductStatsDisplay({
	className,
}: ProductStatsDisplayProps) {
	const { totalProducts, totalTeaWeight } = useProductStats();

	const formatWeight = (weight: number) => {
		if (weight === 0) return "0g";
		if (weight < 1000) return `${weight}g`;
		return `${(weight / 1000).toFixed(1)}kg`;
	};

	return (
		<div
			className={cn(
				"flex items-center gap-2 p-2 bg-muted/50 rounded-lg border min-w-0",
				className,
			)}
		>
			<div className="flex items-center gap-1.5 min-w-0">
				<Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
				<span className="text-sm font-medium truncate">
					{totalProducts} products
				</span>
			</div>

			<div className="flex items-center gap-1.5 min-w-0">
				<Leaf className="h-4 w-4 text-muted-foreground flex-shrink-0" />
				<span className="text-sm font-medium truncate">
					{formatWeight(totalTeaWeight)}
				</span>
			</div>
		</div>
	);
}

/**
 * Compact version for smaller spaces - shows products count and tea weight
 */
export function ProductStatsCompact({ className }: { className?: string }) {
	const { totalProducts, totalTeaWeight } = useProductStats();

	const formatWeight = (weight: number) => {
		if (weight === 0) return "0g";
		if (weight < 1000) return `${weight}g`;
		return `${(weight / 1000).toFixed(1)}kg`;
	};

	return (
		<div
			className={cn(
				"flex items-center gap-3 text-sm text-muted-foreground min-w-0",
				className,
			)}
		>
			<div className="flex items-center gap-1 min-w-0">
				<Package className="h-4 w-4 flex-shrink-0" />
				<span className="truncate">{totalProducts} products</span>
			</div>
			<div className="flex items-center gap-1 min-w-0">
				<Leaf className="h-4 w-4 flex-shrink-0" />
				<span className="truncate">{formatWeight(totalTeaWeight)}</span>
			</div>
		</div>
	);
}
