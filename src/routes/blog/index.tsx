import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { BlogIndexSkeleton } from "~/components/ui/blog/BlogIndexSkeleton";
import { BlogIndexErrorComponent } from "~/components/ui/blog/BlogIndexError";
import BlogPostCard from "~/components/ui/blog/BlogPostCard";
import { FilterGroup } from "~/components/ui/shared/FilterGroup";
import { blogPostsQueryOptions } from "~/lib/queryOptions";
import { seo } from "~/utils/seo";

export const Route = createFileRoute("/blog/")({
	component: PostsIndexComponent,
	pendingComponent: BlogIndexSkeleton,
	errorComponent: BlogIndexErrorComponent,
	// Prefetch blog posts before component renders
	loader: async ({ context: { queryClient } }) => {
		await queryClient.ensureQueryData(blogPostsQueryOptions());
	},
	head: () => ({
		meta: [
			...seo({
				title: "Tea Blog - Rublevsky Studio",
				description:
					"Chinese tea studies, reviews, and comparisons. Gong Fu Cha tea practices and tutorials.",
			}),
		],
	}),
});

function PostsIndexComponent() {
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

	// Use suspense query - data is guaranteed to be loaded by the loader
	const { data } = useSuspenseQuery(blogPostsQueryOptions());

	const posts = data.posts;
	const teaCategories = data.teaCategories;
	const totalCount = data.totalCount;

	// Filter tea categories to only show those that are used in blog posts
	const usedTeaCategories = useMemo(() => {
		if (teaCategories.length === 0) return [];

		const usedCategories = new Set(
			posts.flatMap((post) => post.teaCategories || []),
		);
		return teaCategories.filter((category) =>
			usedCategories.has(category.slug),
		);
	}, [posts, teaCategories]);

	// Filter posts based on selected category
	const filteredPosts = useMemo(() => {
		if (!selectedCategory) return posts;
		return posts.filter((post) =>
			post.teaCategories?.includes(selectedCategory),
		);
	}, [posts, selectedCategory]);

	return (
		<main>
			<section className="pt-24 sm:pt-32 div min-h-screen no-padding">
				<div className="">
					{/* Header */}
					<div className="text-center mb-12 px-4">
						<h1 className="mb-8">What&apos;s in the gaiwan?</h1>
						<div className="flex justify-center items-center gap-8 mb-8">
							<h5 className="text-secondary-foreground">{totalCount} posts</h5>
							<h5>
								<a className="blurLink" href="https://t.me/gaiwan_contents">
									🇷🇺 RU blog version
								</a>
							</h5>
						</div>
					</div>

					{/* Filters */}
					{usedTeaCategories.length > 0 && (
						<div className="flex justify-center mb-12 px-4">
							<FilterGroup
								className="justify-center"
								options={usedTeaCategories}
								selectedOptions={selectedCategory}
								onOptionChange={setSelectedCategory}
								showAllOption={true}
								allOptionLabel="All Categories"
							/>
						</div>
					)}

					{/* Content */}
					<AnimatePresence mode="popLayout">
						{filteredPosts.length === 0 ? (
							<motion.p
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								className="text-center text-lg"
							>
								No blog posts found for the selected categories.
							</motion.p>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4  gap-y-6 gap-x-3 sm:gap-4 items-start">
								{filteredPosts.map((post) => (
									<motion.div
										key={post.id}
										layout
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -20 }}
										transition={{ duration: 0.3 }}
									>
										<BlogPostCard post={post} teaCategories={teaCategories} />
									</motion.div>
								))}
							</div>
						)}
					</AnimatePresence>
				</div>
			</section>
		</main>
	);
}
