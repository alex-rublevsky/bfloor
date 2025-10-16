import { Button } from "~/components/ui/shared/Button";
import { Input } from "~/components/ui/shared/Input";
import { Switch } from "~/components/ui/shared/Switch";
import { generateSlug, useIsCustomSlug } from "~/hooks/useSlugGeneration";
import { cn } from "~/lib/utils";
import { Badge } from "../shared/Badge";

interface SlugFieldProps {
	/** Current slug value */
	slug: string;
	/** Name field value (used for generating slug) */
	name: string;
	/** Whether auto-slug is enabled */
	isAutoSlug: boolean;
	/** Callback when slug changes */
	onSlugChange: (slug: string) => void;
	/** Callback when auto-slug toggle changes */
	onAutoSlugChange: (isAuto: boolean) => void;
	/** Optional: Whether field is required */
	required?: boolean;
	/** Optional: Additional className for validation styling */
	className?: string;
	/** Optional: ID prefix for unique IDs */
	idPrefix?: string;
	/** Optional: Show reset button (products page style) */
	showResetButton?: boolean;
}

/**
 * Reusable slug field with auto-generation toggle
 * Used across dashboard forms (products, blog, etc.)
 */
export function SlugField({
	slug,
	name,
	isAutoSlug,
	onSlugChange,
	onAutoSlugChange,
	required = true,
	className,
	idPrefix = "",
	showResetButton = false,
}: SlugFieldProps) {
	const slugId = `${idPrefix}slug`;
	const autoSlugId = `${idPrefix}autoSlug`;

	// Check if current slug is custom (doesn't match auto-generated)
	const isCustomSlug = useIsCustomSlug(slug, name);

	const handleResetClick = () => {
		onAutoSlugChange(true);
		if (name) {
			onSlugChange(generateSlug(name));
		}
	};

	// Blog-style layout with switch toggle
	if (!showResetButton) {
		return (
			<div>
				<div className="flex items-center justify-between mb-1">
					<div className="flex items-center gap-2">
						<label htmlFor={slugId} className="block text-sm font-medium">
							Slug
						</label>
						{isCustomSlug && (
							<Badge className="" variant="default">
								custom
							</Badge>
						)}
					</div>
					<div className="flex items-center space-x-2">
						<Switch
							id={autoSlugId}
							checked={isAutoSlug}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
								onAutoSlugChange(e.target.checked);
							}}
						/>
						<label
							htmlFor={autoSlugId}
							className="text-xs text-muted-foreground"
						>
							Auto-generate
						</label>
					</div>
				</div>
				<Input
					id={slugId}
					name="slug"
					value={slug}
					onChange={(e) => onSlugChange(e.target.value)}
					required={required}
					disabled={isAutoSlug}
					className={cn(
						isAutoSlug ? "opacity-60 cursor-not-allowed" : "",
						className,
					)}
				/>
			</div>
		);
	}

	// Products-style layout with reset button
	return (
		<div className="flex items-end gap-2">
			<Input
				label="Идентификатор (автоматический)"
				id={slugId}
				type="text"
				name="slug"
				value={slug}
				onChange={(e) => {
					onAutoSlugChange(false);
					onSlugChange(e.target.value);
				}}
				required={required}
				className={cn("flex-1", className)}
			/>
			<Button
				type="button"
				size="sm"
				variant="outline"
				onClick={handleResetClick}
			>
				Reset
			</Button>
		</div>
	);
}
