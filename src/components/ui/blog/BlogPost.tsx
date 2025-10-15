import "./blogPost.css";

import { Link } from "@tanstack/react-router";
import ReactMarkdown from "react-markdown";
import ImageGallery from "~/components/ui/shared/ImageGallery";
import { formatBlogDate } from "~/lib/utils";
import {
	markdownComponents,
	rehypePlugins,
} from "../shared/MarkdownComponents";
import { CopyLinkButton } from "./CopyLinkButton";

interface BlogPostProps {
	title: string | null;
	body: string;
	images: string | null;
	slug: string;
	publishedAt: number;
	id?: number; // Add id for fallback title consistency
	productSlug?: string | null; // Add productSlug for product links
	onlyImages?: boolean; // Render only the image gallery
	onlyContent?: boolean; // Render only the content (no images)
}

function BlogPost({
	title,
	body,
	images,
	slug,
	publishedAt,
	id,
	productSlug,
	onlyImages = false,
	onlyContent = false,
}: BlogPostProps) {
	// Convert comma-separated string to array, filter out empty strings, or empty array if null
	const imageArray = images
		? images
				.split(",")
				.map((img) => img.trim())
				.filter((img) => img !== "")
		: [];

	// If onlyImages is true, render only the image gallery
	if (onlyImages) {
		return (
			<>
				{imageArray.length > 0 && (
					<ImageGallery
						images={imageArray}
						alt={title || `Blog post ${id || slug}`}
						className="lg:pl-4 lg:pt-4 lg:pb-4"
						productSlug={slug}
						size="default"
						viewTransitionName={`blog-image-${slug}`}
					/>
				)}
			</>
		);
	}

	// If onlyContent is true, render only the content (no images)
	if (onlyContent) {
		return (
			<article id={`${slug}`}>
				<div className="sticky-header-container-constrained">
					<div className="relative z-1">
						<h1
							className="!text-3xl md:!text-4xl"
							style={{ viewTransitionName: `blog-title-${slug}` }}
						>
							{title && title.trim() !== ""
								? title
								: id
									? `Post ${id}`
									: "Untitled Post"}
						</h1>

						<div className="my-2 flex gap-4 items-center">
							<div className="flex gap-4">
								{productSlug && (
									<Link
										to="/store/$productId"
										params={{
											productId: productSlug,
										}}
										className="blurLink"
									>
										<h6 className="whitespace-nowrap">Purchase →</h6>
									</Link>
								)}
								<time className="whitespace-nowrap">
									{new Date(publishedAt).toLocaleDateString("en-US", {
										year: "numeric",
										month: "short",
										day: "numeric",
										timeZone: "UTC",
									})}
								</time>
							</div>
							<CopyLinkButton sectionId={slug} />
						</div>
					</div>
				</div>

				<div className="prose prose -mt-6">
					<ReactMarkdown
						components={markdownComponents}
						rehypePlugins={rehypePlugins}
					>
						{body}
					</ReactMarkdown>
				</div>
			</article>
		);
	}

	// Default: render the full blog post (for backwards compatibility)
	return (
		<article id={`${slug}`} className="max-w-2xl mx-auto">
			{imageArray.length > 0 && (
				<div className="relative w-screen left-[50%] right-[50%] -translate-x-1/2 py-12">
					<div className="flex justify-center">
						<ImageGallery
							images={imageArray}
							alt={title || `Blog post ${id || slug}`}
							className="max-w-6xl"
							productSlug={slug}
							size="default"
							viewTransitionName={`blog-image-${slug}`}
						/>
					</div>
				</div>
			)}

			<div className="sticky-header-container-sidebar">
				<div className="relative z-1">
					<h3 style={{ viewTransitionName: `blog-title-${slug}` }}>
						{title && title.trim() !== ""
							? title
							: id
								? `Post ${id}`
								: "Untitled Post"}
					</h3>

					<div className="my-2 flex gap-4 items-center">
						<div className="flex gap-4">
							{productSlug && (
								<Link
									to="/store/$productId"
									params={{
										productId: productSlug,
									}}
									className="blurLink"
								>
									<h6 className="whitespace-nowrap">Purchase →</h6>
								</Link>
							)}
							<time className="whitespace-nowrap">
								{formatBlogDate(publishedAt)}
							</time>
						</div>
						<CopyLinkButton sectionId={slug} />
					</div>
				</div>
			</div>
			<div className="prose prose-lg -mt-6">
				<ReactMarkdown
					components={markdownComponents}
					rehypePlugins={rehypePlugins}
				>
					{body}
				</ReactMarkdown>
			</div>
		</article>
	);
}

export default BlogPost;
