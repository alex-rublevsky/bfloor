import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { toast } from "sonner";
import { CategoryTreeView } from "~/components/ui/dashboard/CategoryTreeView";
import DeleteConfirmationDialog from "~/components/ui/dashboard/ConfirmationDialog";
import { DashboardFormDrawer } from "~/components/ui/dashboard/DashboardFormDrawer";
import { DrawerSection } from "~/components/ui/dashboard/DrawerSection";
import { SlugField } from "~/components/ui/dashboard/SlugField";
import { CategoriesPageSkeleton } from "~/components/ui/dashboard/skeletons/CategoriesPageSkeleton";
import { Input } from "~/components/ui/shared/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/shared/Select";
import { Switch } from "~/components/ui/shared/Switch";
import { useDashboardForm } from "~/hooks/useDashboardForm";
import { generateSlug, useSlugGeneration } from "~/hooks/useSlugGeneration";
import { buildCategoryTree } from "~/lib/categoryTree";
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
	const createParentCategoryId = useId();
	const editParentCategoryId = useId();

	// Use suspense queries - data is guaranteed to be loaded by the loader
	const { data: categoriesData } = useSuspenseQuery(
		productCategoriesQueryOptions(),
	);

	// Build tree structure from flat categories
	const categoryTree = useMemo(
		() => buildCategoryTree(categoriesData || []),
		[categoriesData],
	);

	// Category type state - only product categories are supported
	const [categoryType, setCategoryType] = useState<"product">("product");

	// Use our dashboard form hooks - one for each category type
	const productCategoryForm = useDashboardForm<CategoryFormData>(
		{
			name: "",
			slug: "",
			parentSlug: null,
			image: "",
			isActive: true,
		},
		{ listenToActionButton: true },
	);

	// Get the active form based on category type
	const activeForm = productCategoryForm;

	const [isCreateAutoSlug, setIsCreateAutoSlug] = useState(true);
	const [isEditAutoSlug, setIsEditAutoSlug] = useState(false);
	const [editingCategoryId, setEditingCategoryId] = useState<number | null>(
		null,
	);
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

	// Listen for action button clicks from navbar
	useEffect(() => {
		const handleAction = () => {
			setCategoryType("product");
			productCategoryForm.crud.openCreateDrawer();
		};

		window.addEventListener("dashboardAction", handleAction);
		return () => window.removeEventListener("dashboardAction", handleAction);
	}, [productCategoryForm.crud.openCreateDrawer]);

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
			queryClient.invalidateQueries({
				queryKey: ["bfloorDashboardCategories"],
			});

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
			parentSlug: category.parentSlug || null,
			image: category.image || "",
			isActive: category.isActive,
		});
		setIsEditAutoSlug(!isCustomSlug);
		productCategoryForm.crud.openEditDrawer();
	};

	// Handler for editing categories

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
			queryClient.invalidateQueries({
				queryKey: ["bfloorDashboardCategories"],
			});

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

	// Handler for deleting categories

	const handleDeleteConfirm = async () => {
		if (!deletingCategoryId) return;

		activeForm.crud.startDeleting();

		try {
			await deleteProductCategory({ data: { id: deletingCategoryId } });

			toast.success("Категория удалена успешно!");

			// Refresh the relevant query
			queryClient.invalidateQueries({
				queryKey: ["bfloorDashboardCategories"],
			});

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
			{/* Product Categories Section */}
			<div className="space-y-4">
				<div className="border rounded-lg p-4 bg-card">
					<CategoryTreeView
						tree={categoryTree}
						onEdit={handleEditCategory}
						onDelete={handleDeleteCategoryClick}
					/>
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
					<DrawerSection maxWidth title={`Category Details`}>
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

							{/* Parent Category Selector */}
							<div>
								<label
									htmlFor={createParentCategoryId}
									className="block text-sm font-medium mb-1"
								>
									Parent Category (optional)
								</label>
								<Select
									value={
										(activeForm.createForm.formData as CategoryFormData)
											.parentSlug || "none"
									}
									onValueChange={(value: string) => {
										productCategoryForm.createForm.updateField(
											"parentSlug",
											value === "none" ? null : value,
										);
									}}
								>
									<SelectTrigger id={createParentCategoryId}>
										<SelectValue placeholder="None (top-level category)" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="none">
											None (top-level category)
										</SelectItem>
										{categoriesData
											.filter((cat) => cat.isActive)
											.map((category) => (
												<SelectItem key={category.slug} value={category.slug}>
													{category.name}
												</SelectItem>
											))}
									</SelectContent>
								</Select>
							</div>

							{categoryType === "product" && (
								<Input
									label="Ссылка на изображение"
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
					<DrawerSection maxWidth title={`Category Details`}>
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

							{/* Parent Category Selector */}
							<div>
								<label
									htmlFor={editParentCategoryId}
									className="block text-sm font-medium mb-1"
								>
									Parent Category (optional)
								</label>
								<Select
									value={
										(activeForm.editForm.formData as CategoryFormData)
											.parentSlug || "none"
									}
									onValueChange={(value: string) => {
										productCategoryForm.editForm.updateField(
											"parentSlug",
											value === "none" ? null : value,
										);
									}}
								>
									<SelectTrigger id={editParentCategoryId}>
										<SelectValue placeholder="None (top-level category)" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="none">
											None (top-level category)
										</SelectItem>
										{categoriesData
											.filter(
												(cat) =>
													cat.isActive &&
													cat.slug !== activeForm.editForm.formData.slug,
											)
											.map((category) => (
												<SelectItem key={category.slug} value={category.slug}>
													{category.name}
												</SelectItem>
											))}
									</SelectContent>
								</Select>
							</div>

							{categoryType === "product" && (
								<Input
									label="Ссылка на изображение"
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
					description={`Are you sure you want to delete this category? This action cannot be undone.`}
					isDeleting={activeForm.crud.isDeleting}
				/>
			)}
		</div>
	);
}
