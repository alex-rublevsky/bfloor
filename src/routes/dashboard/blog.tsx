import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { toast } from "sonner";
import DashboardBlogPostCard from "~/components/ui/blog/DashboardBlogPostCard";
import DeleteConfirmationDialog from "~/components/ui/dashboard/ConfirmationDialog";
import { DashboardFormDrawer } from "~/components/ui/dashboard/DashboardFormDrawer";
import { DescriptionField } from "~/components/ui/dashboard/DescriptionField";
import { DrawerSection } from "~/components/ui/dashboard/ProductFormSection";
import ProductSelector from "~/components/ui/dashboard/ProductSelector";
import { SlugField } from "~/components/ui/dashboard/SlugField";
import { TeaCategoriesSelector } from "~/components/ui/dashboard/TeaCategoriesSelector";
import { DatePicker } from "~/components/ui/shared/DatePicker";
import { FilterGroup } from "~/components/ui/shared/FilterGroup";
import { Input } from "~/components/ui/shared/Input";
import { Switch } from "~/components/ui/shared/Switch";
import { generateSlug, useSlugGeneration } from "~/hooks/useSlugGeneration";
import { createBlogPost } from "~/server_functions/dashboard/blog/createBlogPost";
import { deleteBlogPost } from "~/server_functions/dashboard/blog/deleteBlogPost";
import { getAllBlogPosts } from "~/server_functions/dashboard/blog/getAllBlogPosts";
import { updateBlogPost } from "~/server_functions/dashboard/blog/updateBlogPost";
import type { BlogPost, BlogPostFormData, TeaCategory } from "~/types";

export const Route = createFileRoute("/dashboard/blog")({
	component: RouteComponent,
});

function RouteComponent() {
	const queryClient = useQueryClient();

	const createBlogFormId = useId();
	const titleId = useId();
	const bodyId = useId();
	const imagesId = useId();
	const isVisibleId = useId();
	const editBlogFormId = useId();
	const editTitleId = useId();
	const editBodyId = useId();
	const editImagesId = useId();
	const editIsVisibleId = useId();

	// Query for blog posts and tea categories
	const {
		isPending: isLoading,
		isError,
		data,
	} = useQuery<{
		posts: BlogPost[];
		teaCategories: TeaCategory[];
	}>({
		queryKey: ["dashboard-blog"],
		queryFn: () => getAllBlogPosts(),
	});

	const blogPosts = data?.posts || [];
	const teaCategories = data?.teaCategories || [];
	const errorMessage = isError;

	const [showCreateDrawer, setShowCreateDrawer] = useState(false);

	// Form data states
	const [createFormData, setCreateFormData] = useState<BlogPostFormData>({
		title: "",
		slug: "",
		body: "",
		teaCategories: [],
		productSlug: "",
		images: "",
		isVisible: true,
		publishedAt: Date.now(),
	});

	const [editFormData, setEditFormData] = useState<BlogPostFormData>({
		title: "",
		slug: "",
		body: "",
		teaCategories: [],
		productSlug: "",
		images: "",
		isVisible: true,
		publishedAt: Date.now(),
	});

	// UI states
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState("");
	const [isCreateAutoSlug, setIsCreateAutoSlug] = useState(true);
	const [isEditAutoSlug, setIsEditAutoSlug] = useState(false);
	const [editingPostId, setEditingPostId] = useState<number | null>(null);
	const [showEditDrawer, setShowEditDrawer] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [deletingPostId, setDeletingPostId] = useState<number | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const [visibilityFilter, setVisibilityFilter] = useState<string | null>(
		"visible",
	);
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

	// Filter tea categories to only show those that are used in blog posts
	const usedTeaCategories = useMemo(() => {
		if (teaCategories.length === 0) return [];

		const usedCategories = new Set(
			blogPosts.flatMap((post) => post.teaCategories || []),
		);
		return teaCategories.filter((category) =>
			usedCategories.has(category.slug),
		);
	}, [blogPosts, teaCategories]);

	// Filter posts based on both visibility and category
	const filteredBlogPosts = useMemo(() => {
		let filtered = blogPosts;

		// Apply visibility filter
		if (visibilityFilter === "visible") {
			filtered = filtered.filter((post) => post.isVisible);
		} else if (visibilityFilter === "hidden") {
			filtered = filtered.filter((post) => !post.isVisible);
		}

		// Apply category filter
		if (selectedCategory) {
			filtered = filtered.filter((post) =>
				post.teaCategories?.includes(selectedCategory),
			);
		}

		return filtered;
	}, [blogPosts, visibilityFilter, selectedCategory]);

	// Visibility filter options
	const visibilityFilterOptions = [
		{ slug: "visible", name: "Visible" },
		{ slug: "hidden", name: "Hidden" },
	];

	// Stable callbacks for slug generation
	const handleCreateSlugChange = useCallback(
		(slug: string) => setCreateFormData((prev) => ({ ...prev, slug })),
		[],
	);

	const handleEditSlugChange = useCallback(
		(slug: string) => setEditFormData((prev) => ({ ...prev, slug })),
		[],
	);

	// Auto-generate slugs
	useSlugGeneration(
		createFormData.title || "",
		isCreateAutoSlug,
		handleCreateSlugChange,
	);
	useSlugGeneration(
		editFormData.title || "",
		isEditAutoSlug,
		handleEditSlugChange,
	);

	// Listen for action button clicks from navbar
	useEffect(() => {
		const handleAction = () => {
			setShowCreateDrawer(true);
		};

		window.addEventListener("dashboardAction", handleAction);
		return () => window.removeEventListener("dashboardAction", handleAction);
	}, []);

	// Event handlers
	const handleCreateChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>,
	) => {
		const { name, value, type } = e.target;
		const checked = (e.target as HTMLInputElement).checked;

		if (name === "slug") {
			setIsCreateAutoSlug(false);
		}

		setCreateFormData({
			...createFormData,
			[name]: type === "checkbox" ? checked : value,
		});
	};

	const handleEditChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>,
	) => {
		const { name, value, type } = e.target;
		const checked = (e.target as HTMLInputElement).checked;

		if (name === "slug") {
			setIsEditAutoSlug(false);
		}

		setEditFormData({
			...editFormData,
			[name]: type === "checkbox" ? checked : value,
		});
	};

	const handleProductSelect = (productSlug: string) => {
		setCreateFormData({
			...createFormData,
			productSlug,
		});
	};

	const handleEditProductSelect = (productSlug: string) => {
		setEditFormData({
			...editFormData,
			productSlug,
		});
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsSubmitting(true);
		setError("");

		try {
			await createBlogPost({ data: createFormData });

			toast.success("Blog post added successfully!");

			closeCreateDrawer();
			queryClient.invalidateQueries({
				queryKey: ["dashboard-blog"],
			});
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "An error occurred";
			setError(errorMessage);
			toast.error(errorMessage);
		} finally {
			setIsSubmitting(false);
		}
	};

	const closeCreateDrawer = () => {
		setShowCreateDrawer(false);
		setCreateFormData({
			title: "",
			slug: "",
			body: "",
			teaCategories: [],
			productSlug: "",
			images: "",
			isVisible: true,
			publishedAt: Date.now(),
		});
		setIsCreateAutoSlug(true);
		setError("");
	};

	const handleEdit = async (post: BlogPost) => {
		setEditingPostId(post.id);
		setShowEditDrawer(true);

		// Determine if slug is custom (doesn't match auto-generated)
		const isCustomSlug = post.slug !== generateSlug(post.title || "");

		setEditFormData({
			title: post.title || "",
			slug: post.slug,
			body: post.body || "",
			teaCategories: post.teaCategories || [],
			productSlug: post.productSlug || "",
			images: post.images || "",
			isVisible: post.isVisible ?? true,
			publishedAt: Number.isNaN(new Date(post.publishedAt).getTime())
				? Date.now()
				: post.publishedAt,
		});

		setIsEditAutoSlug(!isCustomSlug);
	};

	const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!editingPostId) return;

		setIsSubmitting(true);
		setError("");

		try {
			await updateBlogPost({ data: { id: editingPostId, data: editFormData } });

			toast.success("Blog post updated successfully!");
			closeEditDrawer();
			queryClient.invalidateQueries({
				queryKey: ["dashboard-blog"],
			});
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "An error occurred";
			setError(errorMessage);
			toast.error(errorMessage);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteClick = (post: BlogPost) => {
		setDeletingPostId(post.id);
		setShowDeleteDialog(true);
	};

	const handleDeleteConfirm = async () => {
		if (!deletingPostId) return;

		setIsDeleting(true);
		setError("");

		try {
			await deleteBlogPost({ data: { id: deletingPostId } });

			toast.success("Blog post deleted successfully!");
			setShowDeleteDialog(false);
			setDeletingPostId(null);
			queryClient.invalidateQueries({
				queryKey: ["dashboard-blog"],
			});
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "An error occurred";
			setError(errorMessage);
			toast.error(errorMessage);
		} finally {
			setIsDeleting(false);
		}
	};

	const closeEditDrawer = () => {
		setShowEditDrawer(false);
		setEditingPostId(null);
		setEditFormData({
			title: "",
			slug: "",
			body: "",
			teaCategories: [],
			productSlug: "",
			images: "",
			isVisible: true,
			publishedAt: Date.now(),
		});
		setIsEditAutoSlug(true);
		setError("");
	};

	// JSX
	if (errorMessage) {
		return (
			<div className="bg-destructive/20 border border-destructive text-destructive-foreground px-4 py-3 rounded">
				{errorMessage}
			</div>
		);
	}

	return (
		<div className="min-h-screen">
			{/* Header */}
			<div className="text-center mb-12 px-4">
				<h1 className="mb-4">Blog Management</h1>
				<div className="flex justify-center items-center gap-8 mb-8">
					<h5 className="text-secondary-foreground">
						{blogPosts.length} posts total
					</h5>
					<h5 className="text-secondary-foreground">
						{blogPosts.filter((post) => post.isVisible).length} visible
					</h5>
					<h5 className="text-secondary-foreground">
						{blogPosts.filter((post) => !post.isVisible).length} hidden
					</h5>
					{(visibilityFilter || selectedCategory) && (
						<h5 className="text-primary font-medium">
							{filteredBlogPosts.length} filtered
						</h5>
					)}
				</div>
			</div>

			{/* Filters */}
			<div className="space-y-6 mb-8 px-4">
				{/* Tea Category Filter */}
				{usedTeaCategories.length > 0 && (
					<div className="flex justify-center">
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

				{/* Visibility Filter */}
				<div className="flex justify-center">
					<FilterGroup
						className="justify-center"
						options={visibilityFilterOptions}
						selectedOptions={visibilityFilter}
						onOptionChange={setVisibilityFilter}
						showAllOption={true}
						allOptionLabel="All Posts"
					/>
				</div>
			</div>

			{/* Blog Posts List */}
			<DashboardFormDrawer
				isOpen={showCreateDrawer}
				onOpenChange={setShowCreateDrawer}
				title="Create New Blog Post"
				formId={createBlogFormId}
				isSubmitting={isSubmitting}
				submitButtonText="Create Post"
				submittingText="Creating..."
				onCancel={closeCreateDrawer}
				error={error}
				layout="two-column"
				fullWidth={true}
			>
				<form
					onSubmit={handleSubmit}
					id={createBlogFormId}
					className="contents"
				>
					{/* Left Column - Content */}
					<div className="space-y-4">
						<DrawerSection variant="default" title="Content">
							<DescriptionField
								id={bodyId}
								name="body"
								value={createFormData.body}
								onChange={handleCreateChange}
								required
								variant="large"
							/>
						</DrawerSection>
					</div>

					{/* Right Column - Metadata */}
					<div className="space-y-4">
						<DrawerSection variant="default" title="Post Details">
							<div className="space-y-4">
								<Input
									label="Title"
									id={titleId}
									name="title"
									value={createFormData.title}
									onChange={handleCreateChange}
									required
								/>

								<SlugField
									slug={createFormData.slug || ""}
									name={createFormData.title || ""}
									isAutoSlug={isCreateAutoSlug}
									onSlugChange={(slug) =>
										setCreateFormData((prev) => ({ ...prev, slug }))
									}
									onAutoSlugChange={setIsCreateAutoSlug}
									idPrefix="create"
								/>

								<div>
									<label
										htmlFor="product"
										className="block text-sm font-medium mb-1"
									>
										Related Product
									</label>
									<ProductSelector
										selectedProductSlug={createFormData.productSlug || ""}
										onProductSelect={handleProductSelect}
									/>
								</div>

								<Input
									label="Images (comma-separated URLs)"
									id={imagesId}
									name="images"
									value={createFormData.images}
									onChange={handleCreateChange}
								/>

								<DatePicker
									label="Published At"
									date={(() => {
										const timestamp = createFormData.publishedAt;
										if (Number.isNaN(timestamp)) {
											return new Date();
										}
										const date = new Date(timestamp);
										return date;
									})()}
									onDateChange={(date) => {
										setCreateFormData((prev) => ({
											...prev,
											publishedAt: date ? date.getTime() : Date.now(),
										}));
									}}
									placeholder="Select publication date"
								/>

								<div className="flex items-center space-x-2">
									<Switch
										id={isVisibleId}
										checked={createFormData.isVisible ?? true}
										onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
											setCreateFormData((prev) => ({
												...prev,
												isVisible: e.target.checked,
											}));
										}}
									/>
									<label htmlFor="isVisible" className="text-sm font-medium">
										Visible on blog
									</label>
								</div>
							</div>
						</DrawerSection>

						{/* Tea Categories Block */}
						<TeaCategoriesSelector
							teaCategories={teaCategories}
							selectedCategories={createFormData.teaCategories || []}
							onCategoryChange={(categorySlug, checked) => {
								const newCategories = checked
									? [...(createFormData.teaCategories || []), categorySlug]
									: (createFormData.teaCategories || []).filter(
											(slug) => slug !== categorySlug,
										);
								setCreateFormData((prev) => ({
									...prev,
									teaCategories: newCategories,
								}));
							}}
							idPrefix="create"
						/>
					</div>
				</form>
			</DashboardFormDrawer>

			{/* Blog Posts Grid */}
			<div className="px-0">
				{isLoading ? (
					<div className="text-center px-4">Loading blog posts...</div>
				) : blogPosts.length === 0 ? (
					<div className="text-center px-4">No blog posts found.</div>
				) : filteredBlogPosts.length === 0 ? (
					<div className="text-center px-4">
						No blog posts found for the selected filter.
					</div>
				) : (
					<AnimatePresence mode="popLayout">
						<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-y-6 gap-x-3 sm:gap-4 items-start">
							{filteredBlogPosts.map((post) => (
								<motion.div
									key={post.id}
									layout
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -20 }}
									transition={{ duration: 0.3 }}
								>
									<DashboardBlogPostCard
										post={post}
										teaCategories={teaCategories}
										onEdit={handleEdit}
										onDelete={handleDeleteClick}
									/>
								</motion.div>
							))}
						</div>
					</AnimatePresence>
				)}
			</div>

			{/* Edit Drawer */}
			<DashboardFormDrawer
				isOpen={showEditDrawer}
				onOpenChange={setShowEditDrawer}
				title="Edit Blog Post"
				formId={editBlogFormId}
				isSubmitting={isSubmitting}
				submitButtonText="Update Post"
				submittingText="Updating..."
				onCancel={closeEditDrawer}
				error={error}
				layout="two-column"
				fullWidth={true}
			>
				<form onSubmit={handleUpdate} id={editBlogFormId} className="contents">
					{/* Left Column - Content */}
					<div className="space-y-4">
						<DrawerSection variant="default" title="Content">
							<DescriptionField
								id={editBodyId}
								name="body"
								value={editFormData.body}
								onChange={handleEditChange}
								required
								variant="large"
							/>
						</DrawerSection>
					</div>

					{/* Right Column - Metadata */}
					<div className="space-y-4">
						<DrawerSection variant="default" title="Post Details">
							<div className="space-y-4">
								<div>
									<label
										htmlFor={editTitleId}
										className="block text-sm font-medium mb-1"
									>
										Title
									</label>
									<Input
										id={editTitleId}
										name="title"
										value={editFormData.title}
										onChange={handleEditChange}
									/>
								</div>

								<SlugField
									slug={editFormData.slug || ""}
									name={editFormData.title || ""}
									isAutoSlug={isEditAutoSlug}
									onSlugChange={(slug) =>
										setEditFormData((prev) => ({ ...prev, slug }))
									}
									onAutoSlugChange={setIsEditAutoSlug}
									idPrefix="edit"
								/>

								<div>
									<label
										htmlFor="editProduct"
										className="block text-sm font-medium mb-1"
									>
										Related Product
									</label>
									<ProductSelector
										selectedProductSlug={editFormData.productSlug || ""}
										onProductSelect={handleEditProductSelect}
									/>
								</div>

								<Input
									label="Images (comma-separated URLs)"
									id={editImagesId}
									name="images"
									value={editFormData.images}
									onChange={handleEditChange}
								/>

								<DatePicker
									label="Published At"
									date={(() => {
										const timestamp = editFormData.publishedAt;
										if (Number.isNaN(timestamp)) {
											return new Date();
										}
										const date = new Date(timestamp);
										return date;
									})()}
									onDateChange={(date) => {
										setEditFormData((prev) => ({
											...prev,
											publishedAt: date ? date.getTime() : Date.now(),
										}));
									}}
									placeholder="Select publication date"
								/>

								<div className="flex items-center space-x-2">
									<Switch
										id={editIsVisibleId}
										checked={editFormData.isVisible ?? true}
										onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
											setEditFormData((prev) => ({
												...prev,
												isVisible: e.target.checked,
											}));
										}}
									/>
									<label
										htmlFor="editIsVisible"
										className="text-sm font-medium"
									>
										Visible on blog
									</label>
								</div>
							</div>
						</DrawerSection>

						{/* Tea Categories Block */}
						<TeaCategoriesSelector
							teaCategories={teaCategories}
							selectedCategories={editFormData.teaCategories || []}
							onCategoryChange={(categorySlug, checked) => {
								const newCategories = checked
									? [...(editFormData.teaCategories || []), categorySlug]
									: (editFormData.teaCategories || []).filter(
											(slug) => slug !== categorySlug,
										);
								setEditFormData((prev) => ({
									...prev,
									teaCategories: newCategories,
								}));
							}}
							idPrefix="edit"
						/>
					</div>
				</form>
			</DashboardFormDrawer>

			{/* Delete Confirmation Dialog */}
			{showDeleteDialog && (
				<DeleteConfirmationDialog
					isOpen={showDeleteDialog}
					onClose={() => setShowDeleteDialog(false)}
					onConfirm={handleDeleteConfirm}
					title="Delete Blog Post"
					description="Are you sure you want to delete this blog post? This action cannot be undone."
					isDeleting={isDeleting}
				/>
			)}
		</div>
	);
}
