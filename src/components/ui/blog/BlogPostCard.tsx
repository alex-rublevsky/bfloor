import { Link } from "@tanstack/react-router";
import ReactMarkdown from "react-markdown";
import { Badge } from "~/components/ui/shared/Badge";
import {
	markdownComponents,
	rehypePlugins,
} from "~/components/ui/shared/MarkdownComponents";
import { usePrefetch } from "~/hooks/usePrefetch";
import { formatBlogDate } from "~/lib/utils";
import type { BlogPostPreview } from "~/types/index";
import styles from "./blogCard.module.css";

interface BlogPostCardProps {
	post: BlogPostPreview;
	teaCategories?: Array<{ slug: string; name: string }>;
}

export default function BlogPostCard({
	post,
	teaCategories = [],
}: BlogPostCardProps) {
	const { prefetchBlogPost } = usePrefetch();
	const {
		id,
		title,
		slug,
		excerpt,
		images,
		publishedAt,
		teaCategories: postTeaCategories,
	} = post;

	// Create a map for quick lookup of tea category names
	const teaCategoryMap = new Map(
		teaCategories.map((cat) => [cat.slug, cat.name])
	);

	// Extract first image from images string
	const firstImage = images
		? images
				.split(",")
				.map((img) => img.trim())
				.filter((img) => img !== "")[0] || null
		: null;

	return (
		<Link
			to="/blog/$slug"
			params={{ slug }}
			className="block h-full relative"
			viewTransition={true}
			onMouseEnter={() => prefetchBlogPost(slug)}
		>
			<article
				className="w-full overflow-hidden group bg-background flex flex-col h-full"
				id={styles.blogCard}
			>
				{/* Image */}
				{firstImage && (
					<div className="w-full overflow-hidden">
						<img
							src={`https://assets.rublevsky.studio/${firstImage}`}
							alt={title || `Blog post ${id}`}
							width={600}
							height={400}
							loading="eager"
							className="w-full h-auto object-cover"
							style={{ viewTransitionName: `blog-image-${slug}` }}
						/>
					</div>
				)}

				{/* Content */}
				<div className="p-4 flex flex-col flex-1">
					{/* Title */}
					<h4
						className="mb-3"
						style={{ viewTransitionName: `blog-title-${slug}` }}
					>
						{title || `Post ${id}`}
					</h4>

					{/* Excerpt */}
					{excerpt && (
						<div className="text-muted-foreground mb-4 prose prose-sm prose-p:my-0 prose-strong:text-foreground prose-em:text-muted-foreground flex-1">
							<ReactMarkdown
								components={markdownComponents}
								rehypePlugins={rehypePlugins}
							>
								{excerpt}
							</ReactMarkdown>
						</div>
					)}

					{/* Footer with date and tags */}
					<div className="flex items-center justify-between mt-auto">
						{/* Date */}
						<time className="text-sm text-muted-foreground">
							{formatBlogDate(publishedAt)}
						</time>

						{/* Tags */}
						{postTeaCategories && postTeaCategories.length > 0 && (
							<div className="flex flex-wrap gap-1">
								{postTeaCategories.slice(0, 2).map((categorySlug) => {
									const name = teaCategoryMap.get(categorySlug) || categorySlug;
									return (
										<Badge
											key={categorySlug}
											variant={categorySlug as any}
											className="text-xs"
										>
											{name}
										</Badge>
									);
								})}
								{postTeaCategories.length > 2 && (
									<Badge variant="secondary" className="text-xs">
										+{postTeaCategories.length - 2}
									</Badge>
								)}
							</div>
						)}
					</div>
				</div>
			</article>
		</Link>
	);
}
