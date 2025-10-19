import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useId, useState } from "react";
import { toast } from "sonner";
import DeleteConfirmationDialog from "~/components/ui/dashboard/ConfirmationDialog";
import { DashboardFormDrawer } from "~/components/ui/dashboard/DashboardFormDrawer";
import { ImageUpload } from "~/components/ui/dashboard/ImageUpload";
import { SlugField } from "~/components/ui/dashboard/SlugField";
import { BrandsPageSkeleton } from "~/components/ui/dashboard/skeletons/BrandsPageSkeleton";
import { Badge } from "~/components/ui/shared/Badge";
import { Button } from "~/components/ui/shared/Button";
import { EmptyState } from "~/components/ui/shared/EmptyState";
import { Image } from "~/components/ui/shared/Image";
import { Input } from "~/components/ui/shared/input";
import { Switch } from "~/components/ui/shared/Switch";
import { useDashboardForm } from "~/hooks/useDashboardForm";
import { useSlugGeneration } from "~/hooks/useSlugGeneration";
import { createBrand } from "~/server_functions/dashboard/brands/createBrand";
import { deleteBrand } from "~/server_functions/dashboard/brands/deleteBrand";
import { updateBrand } from "~/server_functions/dashboard/brands/updateBrand";
import { getAllBrands } from "~/server_functions/dashboard/getAllBrands";
import type { Brand, BrandFormData } from "~/types";

// Query options factory for reuse
const brandsQueryOptions = () => ({
	queryKey: ["bfloorDashboardBrands"],
	queryFn: () => getAllBrands(),
	staleTime: 1000 * 60 * 5, // Cache for 5 minutes
});

export const Route = createFileRoute("/dashboard/brands")({
	component: RouteComponent,
	pendingComponent: BrandsPageSkeleton,

	// Loader prefetches data before component renders
	loader: async ({ context: { queryClient } }) => {
		// Ensure data is loaded before component renders
		await queryClient.ensureQueryData(brandsQueryOptions());
	},
});

function RouteComponent() {
	const queryClient = useQueryClient();
	const createFormId = useId();
	const editFormId = useId();
	const createIsActiveId = useId();
	const editIsActiveId = useId();

	// Use suspense query - data is guaranteed to be loaded by the loader
	const { data } = useSuspenseQuery(brandsQueryOptions());

	// All-in-one dashboard form management hook
	const { crud, createForm, editForm } = useDashboardForm<BrandFormData>(
		{
			name: "",
			slug: "",
			logo: "",
			isActive: true,
		},
		{ listenToActionButton: true },
	);

	const [isCreateAutoSlug, setIsCreateAutoSlug] = useState(true);
	const [isEditAutoSlug, setIsEditAutoSlug] = useState(false);
	const [editingBrandId, setEditingBrandId] = useState<number | null>(null);
	const [deletingBrandId, setDeletingBrandId] = useState<number | null>(null);

	// Stable callbacks for slug generation
	const handleCreateSlugChange = useCallback(
		(slug: string) => createForm.updateField("slug", slug),
		[createForm.updateField],
	);

	const handleEditSlugChange = useCallback(
		(slug: string) => editForm.updateField("slug", slug),
		[editForm.updateField],
	);

	// Auto-slug generation hooks
	useSlugGeneration(
		createForm.formData.name,
		isCreateAutoSlug,
		handleCreateSlugChange,
	);
	useSlugGeneration(
		editForm.formData.name,
		isEditAutoSlug,
		handleEditSlugChange,
	);

	// Listen for action button clicks from navbar
	useEffect(() => {
		const handleAction = () => {
			crud.openCreateDrawer();
		};

		window.addEventListener("dashboardAction", handleAction);
		return () => window.removeEventListener("dashboardAction", handleAction);
	}, [crud.openCreateDrawer]);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		crud.startSubmitting();

		try {
			await createBrand({
				data: {
					name: createForm.formData.name,
					slug: createForm.formData.slug,
					logo: createForm.formData.logo || "",
					isActive: createForm.formData.isActive,
				},
			});

			toast.success("Brand added successfully!");
			crud.closeCreateDrawer();
			createForm.resetForm();
			setIsCreateAutoSlug(true);
			queryClient.invalidateQueries({ queryKey: ["bfloorDashboardBrands"] });
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : "An error occurred";
			crud.setError(errorMsg);
			toast.error(errorMsg);
		} finally {
			crud.stopSubmitting();
		}
	};

	const handleEdit = (brand: Brand) => {
		setEditingBrandId(brand.id);
		editForm.setFormData({
			name: brand.name,
			slug: brand.slug,
			logo: brand.image || "",
			isActive: brand.isActive,
		});
		setIsEditAutoSlug(true);
		crud.openEditDrawer();
	};

	const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!editingBrandId) return;

		crud.startSubmitting();

		try {
			await updateBrand({
				data: {
					id: editingBrandId,
					data: {
						name: editForm.formData.name,
						slug: editForm.formData.slug,
						logo: editForm.formData.logo || "",
						isActive: editForm.formData.isActive,
					},
				},
			});

			toast.success("Brand updated successfully!");
			crud.closeEditDrawer();
			setEditingBrandId(null);
			editForm.resetForm();
			setIsEditAutoSlug(false);
			queryClient.invalidateQueries({ queryKey: ["bfloorDashboardBrands"] });
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : "An error occurred";
			crud.setError(errorMsg);
			toast.error(errorMsg);
		} finally {
			crud.stopSubmitting();
		}
	};

	const handleDeleteClick = (brand: Brand) => {
		setDeletingBrandId(brand.id);
		crud.openDeleteDialog();
	};

	const handleDeleteConfirm = async () => {
		if (!deletingBrandId) return;

		crud.startDeleting();

		try {
			await deleteBrand({
				data: { id: deletingBrandId },
			});

			toast.success("Brand deleted successfully!");
			crud.closeDeleteDialog();
			setDeletingBrandId(null);
			queryClient.invalidateQueries({ queryKey: ["bfloorDashboardBrands"] });
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : "An error occurred";
			crud.setError(errorMsg);
			toast.error(errorMsg);
		} finally {
			crud.stopDeleting();
		}
	};

	const handleDeleteCancel = () => {
		crud.closeDeleteDialog();
		setDeletingBrandId(null);
	};

	return (
		<div className="space-y-8">
			<div>
				{!data || data.length === 0 ? (
					<EmptyState entityType="brands" />
				) : (
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-border">
							<thead>
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
										Название
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
										Slug
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
										Логотип
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
										Статус
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
										Действия
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border">
								{data?.map((brand) => (
									<tr key={brand.id}>
										<td className="px-6 py-4 whitespace-nowrap">
											{brand.name}
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											{brand.slug}
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											{brand.image ? (
												<div className="h-10 w-10 relative">
													<Image
														src={brand.image}
														alt={brand.name}
														className="object-cover rounded"
													/>
												</div>
											) : (
												<span className="text-muted-foreground">
													Нет логотипа
												</span>
											)}
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<Badge variant={brand.isActive ? "default" : "secondary"}>
												{brand.isActive ? "Активен" : "Неактивен"}
											</Badge>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
											<Button
												size="sm"
												onClick={() => handleEdit(brand)}
												className="mr-4"
											>
												Редактировать
											</Button>
											<Button
												variant="destructive"
												size="sm"
												onClick={() => handleDeleteClick(brand)}
											>
												Удалить
											</Button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>

			{/* Create Brand Drawer */}
			<DashboardFormDrawer
				isOpen={crud.showCreateDrawer}
				onOpenChange={crud.setShowCreateDrawer}
				title="Добавить новый бренд"
				formId={createFormId}
				isSubmitting={crud.isSubmitting}
				submitButtonText="Создать бренд"
				submittingText="Создание..."
				onCancel={() => {
					crud.closeCreateDrawer();
					createForm.resetForm();
					setIsCreateAutoSlug(true);
				}}
				error={crud.error && !crud.showEditDrawer ? crud.error : undefined}
				layout="single-column"
			>
				<form onSubmit={handleSubmit} id={createFormId} className="space-y-4">
					<Input
						label="Название бренда"
						type="text"
						name="name"
						value={createForm.formData.name}
						onChange={createForm.handleChange}
						required
					/>

					<SlugField
						slug={createForm.formData.slug}
						name={createForm.formData.name}
						isAutoSlug={isCreateAutoSlug}
						onSlugChange={(slug) => createForm.updateField("slug", slug)}
						onAutoSlugChange={setIsCreateAutoSlug}
						showResetButton={true}
						idPrefix="create"
					/>

					<ImageUpload
						currentImages={createForm.formData.logo}
						onImagesChange={(images) => createForm.updateField("logo", images)}
						folder="brands"
						slug={createForm.formData.slug}
						productName={createForm.formData.name}
					/>

					<div className="flex items-center">
						<Switch
							id={createIsActiveId}
							name="isActive"
							checked={createForm.formData.isActive}
							onChange={createForm.handleChange}
						/>
						<label htmlFor={createIsActiveId} className="ml-2 text-sm">
							Активен
						</label>
					</div>
				</form>
			</DashboardFormDrawer>

			<DashboardFormDrawer
				isOpen={crud.showEditDrawer}
				onOpenChange={crud.setShowEditDrawer}
				title="Изменить бренд"
				formId={editFormId}
				isSubmitting={crud.isSubmitting}
				submitButtonText="Обновить бренд"
				submittingText="Обновление..."
				onCancel={() => {
					crud.closeEditDrawer();
					setEditingBrandId(null);
					editForm.resetForm();
					setIsEditAutoSlug(false);
				}}
				error={crud.error && crud.showEditDrawer ? crud.error : undefined}
				layout="single-column"
			>
				<form onSubmit={handleUpdate} id={editFormId} className="space-y-4">
					<Input
						label="Название бренда"
						type="text"
						name="name"
						value={editForm.formData.name}
						onChange={editForm.handleChange}
						required
					/>

					<SlugField
						slug={editForm.formData.slug}
						name={editForm.formData.name}
						isAutoSlug={isEditAutoSlug}
						onSlugChange={(slug) => editForm.updateField("slug", slug)}
						onAutoSlugChange={setIsEditAutoSlug}
						showResetButton={true}
						idPrefix="edit"
					/>

					<ImageUpload
						currentImages={editForm.formData.logo}
						onImagesChange={(images) => editForm.updateField("logo", images)}
						folder="brands"
						slug={editForm.formData.slug}
						productName={editForm.formData.name}
					/>

					<div className="flex items-center">
						<Switch
							id={editIsActiveId}
							name="isActive"
							checked={editForm.formData.isActive}
							onChange={editForm.handleChange}
						/>
						<label htmlFor={editIsActiveId} className="ml-2 text-sm">
							Активен
						</label>
					</div>
				</form>
			</DashboardFormDrawer>

			{/* Delete Confirmation Dialog */}
			{crud.showDeleteDialog && (
				<DeleteConfirmationDialog
					isOpen={crud.showDeleteDialog}
					onClose={handleDeleteCancel}
					onConfirm={handleDeleteConfirm}
					title="Удалить бренд"
					description="Вы уверены, что хотите удалить этот бренд? Это действие нельзя отменить."
					isDeleting={crud.isDeleting}
				/>
			)}
		</div>
	);
}
