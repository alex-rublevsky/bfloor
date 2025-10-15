import { Badge } from "./Badge";

interface TeaCategory {
	slug: string;
	name: string;
	description?: string | null;
	blogSlug?: string | null;
	isActive: boolean;
}

interface TeaCategoryLearnMoreProps {
	teaCategories?: TeaCategory[];
	className?: string;
}

export function TeaCategoryLearnMore({
	teaCategories = [],
	className,
}: TeaCategoryLearnMoreProps) {
	if (!teaCategories.length) return null;

	// Filter to only show active categories
	const activeCategories = teaCategories.filter((category) => {
		return category.isActive;
	});

	if (!activeCategories.length) return null;

	// Separate categories with blog slugs from those without
	const categoriesWithBlogs = activeCategories.filter(cat => cat.blogSlug);
	const categoriesWithoutBlogs = activeCategories.filter(cat => !cat.blogSlug);

	return (
		<div className={`flex flex-wrap gap-6 text-sm ${className || ""}`}>
			{/* Categories with blog links */}
			{categoriesWithBlogs.map((category) => (
				<div key={category.slug} className="flex flex-col">
					<span className="text-muted-foreground">Learn more about</span>
					<Badge teaCategory={category} />
				</div>
			))}

			{/* Categories without blog links (with or without descriptions) */}
			{categoriesWithoutBlogs.length > 0 && (
				<div className="flex flex-col">
					<span className="text-muted-foreground">About</span>
					<div className="flex flex-wrap gap-1">
						{categoriesWithoutBlogs.map((category) => (
							<Badge key={category.slug} teaCategory={category} />
						))}
					</div>
				</div>
			)}
		</div>
	);
}
