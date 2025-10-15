import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import BlogPost from "~/components/ui/blog/BlogPost";
import { BlogPostSkeleton } from "~/components/ui/blog/BlogPostSkeleton";
import { BlogPostErrorComponent } from "~/components/ui/blog/BlogPostError";
import ImageGallery from "~/components/ui/shared/ImageGallery";
import { blogPostQueryOptions } from "~/lib/queryOptions";
import type {
	BlogPostPreview,
	BlogPost as BlogPostType,
	TeaCategory,
} from "~/types/index";

export const Route = createFileRoute("/blog/$slug")({
	component: BlogPostComponent,
	pendingComponent: BlogPostSkeleton,
	errorComponent: BlogPostErrorComponent,
	// Prefetch blog post before component renders
	loader: async ({ context: { queryClient }, params: { slug } }) => {
		await queryClient.ensureQueryData(blogPostQueryOptions(slug));
	},
});

function BlogPostComponent() {
	const { slug } = Route.useParams();
	const queryClient = useQueryClient();

	// Use suspense query - data is guaranteed to be loaded by the loader
	const { data: post } = useSuspenseQuery(blogPostQueryOptions(slug));

	// Get cached blog preview data to use as fallback during loading
	const cachedBlogData = queryClient.getQueryData<{
		posts: BlogPostPreview[];
		teaCategories: TeaCategory[];
		totalCount: number;
	}>(["blog"]);

	// Find the preview post from cached data
	const previewPost = useMemo(() => {
		if (!cachedBlogData?.posts) return null;
		return cachedBlogData.posts.find((p) => p.slug === slug) || null;
	}, [cachedBlogData, slug]);

	// Create a fallback post from preview data for immediate rendering
	const fallbackPost = useMemo((): BlogPostType | null => {
		if (!previewPost) return null;

		// Convert BlogPostPreview to BlogPost format
		return {
			id: previewPost.id,
			title: previewPost.title,
			slug: previewPost.slug,
			body: previewPost.excerpt || "", // Use excerpt as body fallback
			images: previewPost.images || null, // Use all images to prevent layout shifts
			productSlug: null, // Preview doesn't have this, will be updated when full data loads
			publishedAt: previewPost.publishedAt,
			teaCategories: previewPost.teaCategories,
			isVisible: true, // Public blog posts are always visible
			productName: null, // Preview doesn't have this, will be updated when full data loads
		};
	}, [previewPost]);

	// Use fallback post during loading to prevent loading state
	const displayPost = post || fallbackPost;

	// Check if the post has images
	const hasImages = displayPost?.images && displayPost.images.trim() !== "";
	const imageArray = hasImages
		? displayPost.images?.split(",").map((img: string) => img.trim()) || []
		: [];

	// Conditional layout based on image presence
	if (!hasImages) {
		// No images layout - centered content
		return (
			<main className="min-h-screen flex flex-col">
				<div className="grow flex items-start justify-center pt-24 sm:pt-32">
					<div className="w-full max-w-3xl mx-auto px-4">
						<div className="space-y-6">
							<BlogPost
								title={displayPost.title}
								body={displayPost.body || ""}
								images={null} // Don't render images in the content area
								productSlug={displayPost.productSlug}
								slug={displayPost.slug || `post-${displayPost.id}`}
								publishedAt={displayPost.publishedAt}
								id={displayPost.id}
								onlyContent={true} // New prop to render only content
							/>
						</div>
					</div>
				</div>
			</main>
		);
	}

	// Original layout with images
	return (
		<main className="min-h-screen flex flex-col lg:h-screen lg:overflow-hidden">
			<div className="grow flex items-start justify-center">
				<div className="w-full h-full flex flex-col lg:flex-row gap-0 lg:gap-10 items-start">
					{/* Image gallery with view transitions */}
					<div className="w-full lg:flex-1 flex flex-col lg:flex-row gap-2 lg:h-full self-start">
						<ImageGallery
							images={imageArray}
							alt={displayPost.title || `Blog post ${displayPost.id}`}
							className="lg:pl-4 lg:pt-4 lg:pb-4"
							productSlug={displayPost.slug || `post-${displayPost.id}`}
							viewTransitionName={`blog-image-${displayPost.slug || `post-${displayPost.id}`}`}
						/>
					</div>

					{/* Blog post information */}
					<div className="w-full md:max-w-[45ch] lg:max-w-[55ch] xl:max-w-[65ch] px-4 lg:h-[100dvh] lg:overflow-y-auto pb-20 lg:pr-4 scrollbar-none lg:flex-shrink-0">
						<div className="space-y-6 w-full">
							<BlogPost
								title={displayPost.title}
								body={displayPost.body || ""}
								images={null} // Don't render images in the content area
								productSlug={displayPost.productSlug}
								slug={displayPost.slug || `post-${displayPost.id}`}
								publishedAt={displayPost.publishedAt}
								id={displayPost.id}
								onlyContent={true} // New prop to render only content
							/>
						</div>
					</div>
				</div>
			</div>
		</main>
	);
}
