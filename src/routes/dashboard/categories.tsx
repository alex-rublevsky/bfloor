import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useCallback, useId, useState } from "react";
import { toast } from "sonner";
import DeleteConfirmationDialog from "~/components/ui/dashboard/ConfirmationDialog";
import { DashboardFormDrawer } from "~/components/ui/dashboard/DashboardFormDrawer";
import { DescriptionField } from "~/components/ui/dashboard/DescriptionField";
import { DrawerSection } from "~/components/ui/dashboard/DrawerSection";
import { SlugField } from "~/components/ui/dashboard/SlugField";
import { CategoriesPageSkeleton } from "~/components/ui/dashboard/skeletons/CategoriesPageSkeleton";
import { Badge } from "~/components/ui/shared/Badge";
import { Button } from "~/components/ui/shared/Button";
import { Input } from "~/components/ui/shared/Input";
import { Switch } from "~/components/ui/shared/Switch";
import { useDashboardForm } from "~/hooks/useDashboardForm";
import { generateSlug, useSlugGeneration } from "~/hooks/useSlugGeneration";
import { storeDataQueryOptions } from "~/lib/queryOptions";
import { createProductCategory } from "~/server_functions/dashboard/categories/createProductCategory";
import { deleteProductCategory } from "~/server_functions/dashboard/categories/deleteProductCategory";
import { getAllProductCategories } from "~/server_functions/dashboard/categories/getAllProductCategories";
import { updateProductCategory } from "~/server_functions/dashboard/categories/updateProductCategory";
import { createTeaCategory } from "~/server_functions/dashboard/tea_categories/createTeaCategory";
import { deleteTeaCategoryBySlug } from "~/server_functions/dashboard/tea_categories/deleteTeaCategoryBySlug";
import { getAllTeaCategories } from "~/server_functions/dashboard/tea_categories/getAllTeaCategories";
import { updateTeaCategoryBySlug } from "~/server_functions/dashboard/tea_categories/updateTeaCategoryBySlug";
import type {
	Category,
	CategoryFormData,
	TeaCategory,
	TeaCategoryFormData,
} from "~/types";

// Query options factories for reuse
const productCategoriesQueryOptions = () => ({
	queryKey: ["dashboard-categories"],
	queryFn: () => getAllProductCategories(),
	staleTime: 1000 * 60 * 5, // Cache for 5 minutes
});

const teaCategoriesQueryOptions = () => ({
	queryKey: ["dashboard-tea-categories"],
	queryFn: () => getAllTeaCategories(),
	staleTime: 1000 * 60 * 5, // Cache for 5 minutes
});

export const Route = createFileRoute("/dashboard/categories")({
	component: RouteComponent,
	pendingComponent: CategoriesPageSkeleton,

	// Loader prefetches data before component renders
	loader: async ({ context: { queryClient } }) => {
		// Ensure data is loaded before component renders
		await Promise.all([
			queryClient.ensureQueryData(productCategoriesQueryOptions()),
			queryClient.ensureQueryData(teaCategoriesQueryOptions()),
		]);
	},
});

function RouteComponent() {
	const queryClient = useQueryClient();
	const createFormId = useId();
	const editFormId = useId();

	// Use suspense queries - data is guaranteed to be loaded by the loader
	const { data: categoriesData } = useSuspenseQuery(
		productCategoriesQueryOptions(),
	);
	const { data: teaCategoriesData } = useSuspenseQuery(
		teaCategoriesQueryOptions(),
	);

	// Category type state (to distinguish between product category and tea category operations)
	const [categoryType, setCategoryType] = useState<"product" | "tea">(
		"product",
	);

	// Use our dashboard form hooks - one for each category type
	const productCategoryForm = useDashboardForm<CategoryFormData>(
		{
			name: "",
			slug: "",
			image: "",
			isActive: true,
		},
		{ listenToActionButton: true },
	);

	const teaCategoryForm = useDashboardForm<TeaCategoryFormData>({
		name: "",
		slug: "",
		description: "",
		blogSlug: "",
		isActive: true,
	});

	// Get the active form based on category type
	const activeForm =
		categoryType === "product" ? productCategoryForm : teaCategoryForm;

	const [isCreateAutoSlug, setIsCreateAutoSlug] = useState(true);
	const [isEditAutoSlug, setIsEditAutoSlug] = useState(false);
	const [editingCategoryId, setEditingCategoryId] = useState<number | null>(
		null,
	);
	const [editingTeaCategorySlug, setEditingTeaCategorySlug] = useState<
		string | null
	>(null);
	const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(
		null,
	);
	const [deletingTeaCategorySlug, setDeletingTeaCategorySlug] = useState<
		string | null
	>(null);

	// Stable callbacks for slug generation
	const handleCreateSlugChange = useCallback(
		(slug: string) => {
			if (categoryType === "product") {
				productCategoryForm.createForm.updateField("slug", slug);
			} else {
				teaCategoryForm.createForm.updateField("slug", slug);
			}
		},
		[
			categoryType,
			productCategoryForm.createForm.updateField,
			teaCategoryForm.createForm.updateField,
		],
	);

	const handleEditSlugChange = useCallback(
		(slug: string) => {
			if (categoryType === "product") {
				productCategoryForm.editForm.updateField("slug", slug);
			} else {
				teaCategoryForm.editForm.updateField("slug", slug);
			}
		},
		[
			categoryType,
			productCategoryForm.editForm.updateField,
			teaCategoryForm.editForm.updateField,
		],
	);

	// Auto-slug generation hooks
	useSlugGeneration(
		activeForm.createForm.formData.name,
		isCreateAutoSlug,
		handleCreateSlugChange,
	);
	useSlugGeneration(
		activeForm.editForm.formData.name,
		isEditAutoSlug,
		handleEditSlugChange,
	);

	// Submit handler for creating categories
	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		activeForm.crud.startSubmitting();

		try {
			if (categoryType === "product") {
				await createProductCategory({
					data: productCategoryForm.createForm.formData as CategoryFormData,
				});
			} else {
				await createTeaCategory({
					data: teaCategoryForm.createForm.formData as TeaCategoryFormData,
				});
			}

			toast.success(
				`${categoryType === "product" ? "Category" : "Tea category"} added successfully!`,
			);

			// Refresh the relevant query
			queryClient.invalidateQueries({
				queryKey:
					categoryType === "product"
						? ["dashboard-categories"]
						: ["dashboard-tea-categories"],
			});

			// For tea categories, also remove store data cache completely - forces fresh fetch on all clients
			if (categoryType === "tea") {
				queryClient.removeQueries({
					queryKey: storeDataQueryOptions().queryKey,
				});
			}

			closeCreateDrawer();
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : "An error occurred";
			activeForm.crud.setError(errorMsg);
			toast.error(errorMsg);
		} finally {
			activeForm.crud.stopSubmitting();
		}
	};

	const closeCreateDrawer = () => {
		activeForm.crud.closeCreateDrawer();
		productCategoryForm.createForm.resetForm();
		teaCategoryForm.createForm.resetForm();
		setIsCreateAutoSlug(true);
	};

	// Handler for editing product categories
	const handleEditCategory = (category: Category) => {
		setCategoryType("product");
		setEditingCategoryId(category.id);
		setEditingTeaCategorySlug(null);

		// Determine if slug is custom (doesn't match auto-generated)
		const isCustomSlug = category.slug !== generateSlug(category.name);

		productCategoryForm.editForm.setFormData({
			name: category.name,
			slug: category.slug,
			image: category.image || "",
			isActive: category.isActive,
		});
		setIsEditAutoSlug(!isCustomSlug);
		productCategoryForm.crud.openEditDrawer();
	};

	// Handler for editing tea categories
	const handleEditTeaCategory = (teaCategory: TeaCategory) => {
		setCategoryType("tea");
		setEditingTeaCategorySlug(teaCategory.slug);
		setEditingCategoryId(null);

		// Determine if slug is custom (doesn't match auto-generated)
		const isCustomSlug = teaCategory.slug !== generateSlug(teaCategory.name);

		teaCategoryForm.editForm.setFormData({
			name: teaCategory.name,
			slug: teaCategory.slug,
			description: teaCategory.description || "",
			blogSlug: teaCategory.blogSlug || "",
			isActive: teaCategory.isActive,
		});
		setIsEditAutoSlug(!isCustomSlug);
		teaCategoryForm.crud.openEditDrawer();
	};

	// Handler for updating categories
	const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (categoryType === "product" && !editingCategoryId) return;
		if (categoryType === "tea" && !editingTeaCategorySlug) return;

		activeForm.crud.startSubmitting();

		try {
			if (categoryType === "product" && editingCategoryId) {
				await updateProductCategory({
					data: {
						id: editingCategoryId,
						data: productCategoryForm.editForm.formData as CategoryFormData,
					},
				});
			} else if (categoryType === "tea" && editingTeaCategorySlug) {
				await updateTeaCategoryBySlug({
					data: {
						slug: editingTeaCategorySlug,
						data: teaCategoryForm.editForm.formData as TeaCategoryFormData,
					},
				});
			}

			toast.success(
				`${categoryType === "product" ? "Category" : "Tea category"} updated successfully!`,
			);

			// Refresh the relevant query
			queryClient.invalidateQueries({
				queryKey:
					categoryType === "product"
						? ["dashboard-categories"]
						: ["dashboard-tea-categories"],
			});

			// For tea categories, also remove store data cache completely - forces fresh fetch on all clients
			if (categoryType === "tea") {
				queryClient.removeQueries({
					queryKey: storeDataQueryOptions().queryKey,
				});
			}

			closeEditModal();
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : "An error occurred";
			activeForm.crud.setError(errorMsg);
			toast.error(errorMsg);
		} finally {
			activeForm.crud.stopSubmitting();
		}
	};

	const closeEditModal = () => {
		activeForm.crud.closeEditDrawer();
		setEditingCategoryId(null);
		setEditingTeaCategorySlug(null);
		productCategoryForm.editForm.resetForm();
		teaCategoryForm.editForm.resetForm();
		setIsEditAutoSlug(false);
	};

	// Handler for deleting product categories
	const handleDeleteCategoryClick = (category: Category) => {
		setCategoryType("product");
		setDeletingCategoryId(category.id);
		setDeletingTeaCategorySlug(null);
		productCategoryForm.crud.openDeleteDialog();
	};

	// Handler for deleting tea categories
	const handleDeleteTeaCategoryClick = (teaCategory: TeaCategory) => {
		setCategoryType("tea");
		setDeletingTeaCategorySlug(teaCategory.slug);
		setDeletingCategoryId(null);
		teaCategoryForm.crud.openDeleteDialog();
	};

	const handleDeleteConfirm = async () => {
		if (categoryType === "product" && !deletingCategoryId) return;
		if (categoryType === "tea" && !deletingTeaCategorySlug) return;

		activeForm.crud.startDeleting();

		try {
			if (categoryType === "product" && deletingCategoryId) {
				await deleteProductCategory({ data: { id: deletingCategoryId } });
			} else if (categoryType === "tea" && deletingTeaCategorySlug) {
				await deleteTeaCategoryBySlug({
					data: { slug: deletingTeaCategorySlug },
				});
			}

			toast.success(
				`${categoryType === "product" ? "Category" : "Tea category"} deleted successfully!`,
			);

			// Refresh the relevant query
			queryClient.invalidateQueries({
				queryKey:
					categoryType === "product"
						? ["dashboard-categories"]
						: ["dashboard-tea-categories"],
			});

			// For tea categories, also remove store data cache completely - forces fresh fetch on all clients
			if (categoryType === "tea") {
				queryClient.removeQueries({
					queryKey: storeDataQueryOptions().queryKey,
				});
			}

			activeForm.crud.closeDeleteDialog();
			setDeletingCategoryId(null);
			setDeletingTeaCategorySlug(null);
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : "An error occurred";
			activeForm.crud.setError(errorMsg);
			toast.error(errorMsg);
		} finally {
			activeForm.crud.stopDeleting();
		}
	};

	const handleDeleteCancel = () => {
		activeForm.crud.closeDeleteDialog();
		setDeletingCategoryId(null);
		setDeletingTeaCategorySlug(null);
	};

	return (
		<div className="space-y-6 px-6">
			{/* Header */}
			<div className="flex justify-between items-center">
				<div>
					<h1 className="">Categories Management</h1>
				</div>
			</div>

			{/* Two-column layout for categories */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
				{/* Product Categories Section */}
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<h3 className="text-lg font-medium">Product Categories</h3>
						<Button
							onClick={() => {
								setCategoryType("product");
								productCategoryForm.crud.openCreateDrawer();
							}}
							size="sm"
						>
							<Plus className="h-4 w-4 mr-1" />
							Add Category
						</Button>
					</div>

					<div>
						{!categoriesData || categoriesData.length === 0 ? (
							<div className="text-center py-8 text-muted-foreground">
								No product categories found
							</div>
						) : (
							<div className="overflow-x-auto">
								<table className="min-w-full">
									<tbody className="divide-y divide-border">
										{categoriesData?.map((category) => (
											<tr key={category.id} className="hover:bg-muted/30">
												<td className="px-1 py-4">
													<div>
														<div className="font-medium">{category.name}</div>
														<div className="text-sm text-muted-foreground">
															{category.slug}
														</div>
													</div>
												</td>
												<td className="px-1 py-4">
													<Badge
														variant={
															category.isActive ? "default" : "secondary"
														}
													>
														{category.isActive ? "Active" : "Inactive"}
													</Badge>
												</td>
												<td className="px-1 py-4 text-right">
													<div className="flex space-x-2 justify-end">
														<Button
															size="sm"
															variant="outline"
															onClick={() => handleEditCategory(category)}
														>
															Edit
														</Button>
														<Button
															variant="destructive"
															size="sm"
															onClick={() =>
																handleDeleteCategoryClick(category)
															}
														>
															Delete
														</Button>
													</div>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</div>
				</div>

				{/* Tea Categories Section */}
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<h3 className="text-lg font-medium">Tea Categories</h3>
						<Button
							onClick={() => {
								setCategoryType("tea");
								teaCategoryForm.crud.openCreateDrawer();
							}}
							size="sm"
						>
							<Plus className="h-4 w-4 mr-1" />
							Add Tea Category
						</Button>
					</div>

					<div>
						{!teaCategoriesData || teaCategoriesData.length === 0 ? (
							<div className="text-center py-8 text-muted-foreground">
								No tea categories found
							</div>
						) : (
							<div className="overflow-x-auto">
								<table className="min-w-full">
									<tbody className="divide-y divide-border">
										{teaCategoriesData?.map((teaCategory) => (
											<tr key={teaCategory.slug} className="hover:bg-muted/30">
												<td className="px-1 py-4">
													<div>
														<div className="font-medium">
															{teaCategory.name}
														</div>
														<div className="text-sm text-muted-foreground">
															{teaCategory.slug}
														</div>
													</div>
												</td>
												<td className="px-1 py-4">
													<Badge
														variant={
															teaCategory.isActive ? "default" : "secondary"
														}
													>
														{teaCategory.isActive ? "Active" : "Inactive"}
													</Badge>
												</td>
												<td className="px-1 py-4 text-right">
													<div className="flex space-x-2 justify-end">
														<Button
															size="sm"
															variant="outline"
															onClick={() => handleEditTeaCategory(teaCategory)}
														>
															Edit
														</Button>
														<Button
															variant="destructive"
															size="sm"
															onClick={() =>
																handleDeleteTeaCategoryClick(teaCategory)
															}
														>
															Delete
														</Button>
													</div>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Create Category Drawer */}
			<DashboardFormDrawer
				isOpen={activeForm.crud.showCreateDrawer}
				onOpenChange={activeForm.crud.setShowCreateDrawer}
				title={`Add New ${categoryType === "product" ? "Product Category" : "Tea Category"}`}
				formId={createFormId}
				isSubmitting={activeForm.crud.isSubmitting}
				submitButtonText={`Create ${categoryType === "product" ? "Category" : "Tea Category"}`}
				submittingText="Creating..."
				onCancel={closeCreateDrawer}
				error={
					activeForm.crud.error && !activeForm.crud.showEditDrawer
						? activeForm.crud.error
						: undefined
				}
				layout="single-column"
			>
				<form onSubmit={handleSubmit} id={createFormId} className="contents">
					<DrawerSection
						maxWidth
						title={`${categoryType === "product" ? "Category" : "Tea Category"} Details`}
					>
						<div className="space-y-4">
							<Input
								label={`${categoryType === "product" ? "Category" : "Tea Category"} Name`}
								type="text"
								name="name"
								value={activeForm.createForm.formData.name}
								onChange={activeForm.createForm.handleChange}
								required
							/>

							<SlugField
								slug={activeForm.createForm.formData.slug}
								name={activeForm.createForm.formData.name}
								isAutoSlug={isCreateAutoSlug}
								onSlugChange={(slug) => {
									setIsCreateAutoSlug(false);
									if (categoryType === "product") {
										productCategoryForm.createForm.updateField("slug", slug);
									} else {
										teaCategoryForm.createForm.updateField("slug", slug);
									}
								}}
								onAutoSlugChange={setIsCreateAutoSlug}
								idPrefix="create"
							/>

							{categoryType === "tea" && (
								<DescriptionField
									label="Description"
									name="description"
									value={(activeForm.createForm.formData as TeaCategoryFormData).description || ""}
									onChange={activeForm.createForm.handleChange}
									placeholder="Enter a description for this tea category..."
								/>
							)}

							{categoryType === "tea" && (
								<Input
									label="Blog Slug"
									type="text"
									name="blogSlug"
									value={(activeForm.createForm.formData as TeaCategoryFormData).blogSlug || ""}
									onChange={activeForm.createForm.handleChange}
									placeholder="e.g., shu-puer-the-foundation-trilogy-part-iii"
								/>
							)}

							{categoryType === "product" && (
								<Input
									label="Image URL"
									type="text"
									name="image"
									value={
										(activeForm.createForm.formData as CategoryFormData)
											.image || ""
									}
									onChange={activeForm.createForm.handleChange}
									placeholder="https://example.com/image.jpg"
								/>
							)}

							<div className="flex items-center gap-2">
								<Switch
									name="isActive"
									checked={activeForm.createForm.formData.isActive}
									onChange={activeForm.createForm.handleChange}
								/>
								<span className="text-sm">Active</span>
							</div>
						</div>
					</DrawerSection>
				</form>
			</DashboardFormDrawer>

			{/* Edit Category Drawer */}
			<DashboardFormDrawer
				isOpen={activeForm.crud.showEditDrawer}
				onOpenChange={activeForm.crud.setShowEditDrawer}
				title={`Edit ${categoryType === "product" ? "Product Category" : "Tea Category"}`}
				formId={editFormId}
				isSubmitting={activeForm.crud.isSubmitting}
				submitButtonText={`Update ${categoryType === "product" ? "Category" : "Tea Category"}`}
				submittingText="Updating..."
				onCancel={closeEditModal}
				error={
					activeForm.crud.error && activeForm.crud.showEditDrawer
						? activeForm.crud.error
						: undefined
				}
				layout="single-column"
			>
				<form onSubmit={handleUpdate} id={editFormId} className="contents">
					<DrawerSection
						maxWidth
						title={`${categoryType === "product" ? "Category" : "Tea Category"} Details`}
					>
						<div className="space-y-4">
							<Input
								label={`${categoryType === "product" ? "Category" : "Tea Category"} Name`}
								type="text"
								name="name"
								value={activeForm.editForm.formData.name}
								onChange={activeForm.editForm.handleChange}
								required
							/>

							<SlugField
								slug={activeForm.editForm.formData.slug}
								name={activeForm.editForm.formData.name}
								isAutoSlug={isEditAutoSlug}
								onSlugChange={(slug) => {
									setIsEditAutoSlug(false);
									if (categoryType === "product") {
										productCategoryForm.editForm.updateField("slug", slug);
									} else {
										teaCategoryForm.editForm.updateField("slug", slug);
									}
								}}
								onAutoSlugChange={setIsEditAutoSlug}
								idPrefix="edit"
							/>

							{categoryType === "tea" && (
								<DescriptionField
									label="Description"
									name="description"
									value={(activeForm.editForm.formData as TeaCategoryFormData).description || ""}
									onChange={activeForm.editForm.handleChange}
									placeholder="Enter a description for this tea category..."
								/>
							)}

							{categoryType === "tea" && (
								<Input
									label="Blog Slug"
									type="text"
									name="blogSlug"
									value={(activeForm.editForm.formData as TeaCategoryFormData).blogSlug || ""}
									onChange={activeForm.editForm.handleChange}
									placeholder="e.g., shu-puer-the-foundation-trilogy-part-iii"
								/>
							)}

							{categoryType === "product" && (
								<Input
									label="Image URL"
									type="text"
									name="image"
									value={
										(activeForm.editForm.formData as CategoryFormData).image ||
										""
									}
									onChange={activeForm.editForm.handleChange}
									placeholder="https://example.com/image.jpg"
								/>
							)}

							<div className="flex items-center gap-2">
								<Switch
									name="isActive"
									checked={activeForm.editForm.formData.isActive}
									onChange={activeForm.editForm.handleChange}
								/>
								<span className="text-sm">Active</span>
							</div>
						</div>
					</DrawerSection>
				</form>
			</DashboardFormDrawer>

			{activeForm.crud.showDeleteDialog && (
				<DeleteConfirmationDialog
					isOpen={activeForm.crud.showDeleteDialog}
					onClose={handleDeleteCancel}
					onConfirm={handleDeleteConfirm}
					title={`Delete ${categoryType === "product" ? "Category" : "Tea Category"}`}
					description={`Are you sure you want to delete this ${categoryType === "product" ? "category" : "tea category"}? This action cannot be undone.`}
					isDeleting={activeForm.crud.isDeleting}
				/>
			)}
		</div>
	);
}
