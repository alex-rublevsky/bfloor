import { Edit, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Badge } from "~/components/ui/shared/Badge";
import {
	markdownComponents,
	rehypePlugins,
} from "~/components/ui/shared/MarkdownComponents";
import { formatBlogDate } from "~/lib/utils";
import type { BlogPost } from "~/types/index";
import styles from "./blogCard.module.css";

interface DashboardBlogPostCardProps {
	post: BlogPost;
	teaCategories?: Array<{ slug: string; name: string }>;
	onEdit: (post: BlogPost) => void;
	onDelete: (post: BlogPost) => void;
}

export default function DashboardBlogPostCard({
	post,
	teaCategories = [],
	onEdit,
	onDelete,
}: DashboardBlogPostCardProps) {
	const {
		id,
		title,
		body,
		images,
		publishedAt,
		isVisible,
		teaCategories: postTeaCategories,
		productSlug,
		productName,
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

	// Create excerpt from body (first 120 characters for dashboard)
	const excerpt =
		body && body.length > 120 ? `${body.substring(0, 120).trim()}...` : body;

	return (
		<article
			className="w-full overflow-hidden bg-background flex flex-col h-full"
			id={styles.blogCard}
		>
			{/* Image and Desktop Action Bar Area */}
			{firstImage && (
				<div className="relative aspect-square overflow-hidden group">
					<img
						src={`https://assets.rublevsky.studio/${firstImage}`}
						alt={title || `Blog post ${id}`}
						loading="eager"
						className="absolute inset-0 w-full h-full object-cover object-center"
					/>

					{/* Desktop Action Buttons */}
					<div className="absolute bottom-0 left-0 right-0 hidden md:flex opacity-0 group-hover:opacity-100 transition-all duration-500">
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								onEdit(post);
							}}
							className="flex-1 flex items-center justify-center space-x-2 bg-muted/70 backdrop-blur-xs text-foreground hover:bg-primary hover:text-primary-foreground active:bg-primary active:text-primary-foreground transition-all duration-500 py-2 cursor-pointer outline-none border-none"
							style={{ margin: 0, padding: "0.5rem 0" }}
						>
							<Edit className="w-4 h-4" />
							<span>Edit</span>
						</button>
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								onDelete(post);
							}}
							className="w-12 flex items-center justify-center bg-muted/70 backdrop-blur-xs text-foreground hover:bg-red-600 hover:text-primary-foreground active:bg-red-600 active:text-primary-foreground transition-all duration-500 cursor-pointer outline-none border-none"
							style={{ margin: 0, padding: "0.5rem 0" }}
						>
							<Trash2 className="w-4 h-4" />
						</button>
					</div>
				</div>
			)}

			{/* Content */}
			<div className="flex flex-col h-auto md:h-full">
				<div className="p-4 flex flex-col h-auto md:h-full">
					{/* Desktop Action Buttons for posts without images */}
					{!firstImage && (
						<div className="hidden md:flex mb-3">
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									onEdit(post);
								}}
								className="flex-1 flex items-center justify-center space-x-2 bg-muted/70 backdrop-blur-xs text-foreground hover:bg-primary hover:text-primary-foreground active:bg-primary active:text-primary-foreground transition-all duration-500 py-2 cursor-pointer outline-none border-none"
								style={{ margin: 0, padding: "0.5rem 0" }}
							>
								<Edit className="w-4 h-4" />
								<span>Edit</span>
							</button>
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									onDelete(post);
								}}
								className="w-12 flex items-center justify-center bg-muted/70 backdrop-blur-xs text-foreground hover:bg-red-600 hover:text-primary-foreground active:bg-red-600 active:text-primary-foreground transition-all duration-500 cursor-pointer outline-none border-none"
								style={{ margin: 0, padding: "0.5rem 0" }}
							>
								<Trash2 className="w-4 h-4" />
							</button>
						</div>
					)}

					{/* Title to match product name typography */}
					<p className="mb-3 font-medium">{title || `Post ${id}`}</p>

					{/* Excerpt */}
					{excerpt && (
						<div className="text-muted-foreground mb-3 prose prose-sm prose-p:my-0 prose-strong:text-foreground prose-em:text-muted-foreground">
							<ReactMarkdown
								components={markdownComponents}
								rehypePlugins={rehypePlugins}
							>
								{excerpt}
							</ReactMarkdown>
						</div>
					)}

					{/* Metadata */}
					<div className="space-y-3 mt-auto">
						{/* Tea Categories */}
						{postTeaCategories && postTeaCategories.length > 0 && (
							<div className="flex flex-wrap gap-1">
								{postTeaCategories.slice(0, 3).map((categorySlug) => {
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
								{postTeaCategories.length > 3 && (
									<Badge variant="secondary" className="text-xs">
										+{postTeaCategories.length - 3}
									</Badge>
								)}
							</div>
						)}

						{/* Linked Product */}
						{productName && productSlug && (
							<div>
								<span className="text-xs text-muted-foreground block mb-1">
									Linked product:
								</span>
								<Badge
									variant="outline"
									className="text-xs cursor-pointer hover:bg-muted active:bg-muted transition-colors"
									onClick={() => window.open(`/store/${productSlug}`, "_blank")}
								>
									{productName}
								</Badge>
							</div>
						)}

						{/* Date and Visibility */}
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<time className="text-sm text-muted-foreground">
									{formatBlogDate(publishedAt)}
								</time>
								<Badge
									className={`text-xs ${isVisible ? "raw-pu-er" : undefined}`}
								>
									{isVisible ? "Visible" : "Hidden"}
								</Badge>
							</div>
						</div>
					</div>

					{/* Mobile Action Buttons */}
					<div className="md:hidden mt-auto flex">
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								onEdit(post);
							}}
							className="flex-1 cursor-pointer flex items-center justify-center space-x-2 bg-muted backdrop-blur-xs text-foreground hover:bg-primary hover:text-primary-foreground active:bg-primary active:text-primary-foreground transition-all duration-500 py-2 px-4 outline-none border-none"
							style={{ margin: 0 }}
						>
							<Edit className="w-4 h-4" />
							<span>Edit</span>
						</button>
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								onDelete(post);
							}}
							className="w-12 cursor-pointer flex items-center justify-center bg-muted backdrop-blur-xs text-foreground hover:bg-red-600 hover:text-primary-foreground active:bg-red-600 active:text-primary-foreground transition-all duration-500 outline-none border-none"
							style={{ margin: 0, padding: "0.5rem 0" }}
						>
							<Trash2 className="w-4 h-4" />
						</button>
					</div>
				</div>
			</div>
		</article>
	);
}
