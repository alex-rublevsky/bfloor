import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useCallback, useId, useState } from "react";
import { toast } from "sonner";
import DeleteConfirmationDialog from "~/components/ui/dashboard/ConfirmationDialog";
import { DashboardFormDrawer } from "~/components/ui/dashboard/DashboardFormDrawer";
import { DrawerSection } from "~/components/ui/dashboard/DrawerSection";
import { SlugField } from "~/components/ui/dashboard/SlugField";
import { CategoriesPageSkeleton } from "~/components/ui/dashboard/skeletons/CategoriesPageSkeleton";
import { Badge } from "~/components/ui/shared/Badge";
import { Button } from "~/components/ui/shared/Button";
import { Input } from "~/components/ui/shared/Input";
import { Switch } from "~/components/ui/shared/Switch";
import { useDashboardForm } from "~/hooks/useDashboardForm";
import { generateSlug, useSlugGeneration } from "~/hooks/useSlugGeneration";
import { createProductCategory } from "~/server_functions/dashboard/categories/createProductCategory";
import { deleteProductCategory } from "~/server_functions/dashboard/categories/deleteProductCategory";
import { getAllProductCategories } from "~/server_functions/dashboard/categories/getAllProductCategories";
import { updateProductCategory } from "~/server_functions/dashboard/categories/updateProductCategory";
import type { Category, CategoryFormData } from "~/types";

// Query options factories for reuse
const productCategoriesQueryOptions = () => ({
	queryKey: ["bfloorDashboardCategories"],
	queryFn: () => getAllProductCategories(),
	staleTime: 1000 * 60 * 5, // Cache for 5 minutes
});

// Tea categories removed for this project

export const Route = createFileRoute("/dashboard/categories")({
	component: RouteComponent,
	pendingComponent: CategoriesPageSkeleton,

	// Loader prefetches data before component renders
	loader: async ({ context: { queryClient } }) => {
		// Ensure data is loaded before component renders
        await queryClient.ensureQueryData(productCategoriesQueryOptions());
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
    // Placeholder text-only block kept later for layout; no tea data

	// Category type state (to distinguish between product category and tea category operations)
    // Only product categories are supported
    const [categoryType, setCategoryType] = useState<"product">("product");

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

    // Tea category form removed

	// Get the active form based on category type
    const activeForm = productCategoryForm;

	const [isCreateAutoSlug, setIsCreateAutoSlug] = useState(true);
	const [isEditAutoSlug, setIsEditAutoSlug] = useState(false);
	const [editingCategoryId, setEditingCategoryId] = useState<number | null>(
		null,
	);
    // Tea tracking state removed
const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(
    null,
);

	// Stable callbacks for slug generation
	const handleCreateSlugChange = useCallback(
        (slug: string) => {
            productCategoryForm.createForm.updateField("slug", slug);
        },
        [productCategoryForm.createForm.updateField],
	);

	const handleEditSlugChange = useCallback(
        (slug: string) => {
            productCategoryForm.editForm.updateField("slug", slug);
        },
        [productCategoryForm.editForm.updateField],
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
            await createProductCategory({
                data: productCategoryForm.createForm.formData as CategoryFormData,
            });

            toast.success("Категория добавлена успешно!");

			// Refresh the relevant query
            queryClient.invalidateQueries({ queryKey: ["bfloorDashboardCategories"] });

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
        // No tea form
		setIsCreateAutoSlug(true);
	};

	// Handler for editing product categories
	const handleEditCategory = (category: Category) => {
        setEditingCategoryId(category.id);

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
    // Tea edit removed

	// Handler for updating categories
	const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
        if (!editingCategoryId) return;

		activeForm.crud.startSubmitting();

		try {
            await updateProductCategory({
                data: {
                    id: editingCategoryId,
                    data: productCategoryForm.editForm.formData as CategoryFormData,
                },
            });

            toast.success("Категория обновлена успешно!");

			// Refresh the relevant query
            queryClient.invalidateQueries({ queryKey: ["bfloorDashboardCategories"] });

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
        productCategoryForm.editForm.resetForm();
		setIsEditAutoSlug(false);
	};

	// Handler for deleting product categories
	const handleDeleteCategoryClick = (category: Category) => {
        setDeletingCategoryId(category.id);
		productCategoryForm.crud.openDeleteDialog();
	};

	// Handler for deleting tea categories
    // Tea delete removed

	const handleDeleteConfirm = async () => {
        if (!deletingCategoryId) return;

		activeForm.crud.startDeleting();

		try {
            await deleteProductCategory({ data: { id: deletingCategoryId } });

            toast.success("Категория удалена успешно!");

			// Refresh the relevant query
            queryClient.invalidateQueries({ queryKey: ["bfloorDashboardCategories"] });

			activeForm.crud.closeDeleteDialog();
            setDeletingCategoryId(null);
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
    // no-op
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

                {/* Tea Categories placeholder: structural component kept only */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Tea Categories (placeholder)</h3>
                    </div>
                    <div className="text-sm text-muted-foreground py-8">
                        Structural placeholder retained for future use. No tea logic.
                    </div>
                </div>
			</div>

			{/* Create Category Drawer */}
            <DashboardFormDrawer
				isOpen={activeForm.crud.showCreateDrawer}
				onOpenChange={activeForm.crud.setShowCreateDrawer}
                title={`Add New Product Category`}
				formId={createFormId}
				isSubmitting={activeForm.crud.isSubmitting}
                submitButtonText={`Create Category`}
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
                        title={`Category Details`}
					>
						<div className="space-y-4">
							<Input
                                label={`Category Name`}
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
                                    productCategoryForm.createForm.updateField("slug", slug);
								}}
								onAutoSlugChange={setIsCreateAutoSlug}
								idPrefix="create"
							/>

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
                title={`Edit Product Category`}
				formId={editFormId}
				isSubmitting={activeForm.crud.isSubmitting}
                submitButtonText={`Update Category`}
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
                        title={`Category Details`}
					>
						<div className="space-y-4">
							<Input
                                label={`Category Name`}
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
                                    productCategoryForm.editForm.updateField("slug", slug);
								}}
								onAutoSlugChange={setIsEditAutoSlug}
								idPrefix="edit"
							/>

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
					title={`Удалить категорию,`}
					description={`Are you sure you want to delete this ${categoryType === "product" ? "category" : "tea category"}? This action cannot be undone.`}
					isDeleting={activeForm.crud.isDeleting}
				/>
			)}
		</div>
	);
}
