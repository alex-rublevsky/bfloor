import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useId, useState, useEffect } from "react";
import { toast } from "sonner";
import DeleteConfirmationDialog from "~/components/ui/dashboard/ConfirmationDialog";
import { DashboardFormDrawer } from "~/components/ui/dashboard/DashboardFormDrawer";
import { DrawerSection } from "~/components/ui/dashboard/DrawerSection";
import { SlugField } from "~/components/ui/dashboard/SlugField";
import { Badge } from "~/components/ui/shared/Badge";
import { Button } from "~/components/ui/shared/Button";
import { Image } from "~/components/ui/shared/Image";
import { Input } from "~/components/ui/shared/Input";
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
import { getAllBrands } from "~/server_functions/dashboard/getAllBrands";
import { createCollection } from "~/server_functions/dashboard/collections/createCollection";
import { updateCollection } from "~/server_functions/dashboard/collections/updateCollection";
import { deleteCollection } from "~/server_functions/dashboard/collections/deleteCollection";
import { getAllCollections } from "~/server_functions/dashboard/collections/getAllCollections";
import type { Collection, CollectionFormData } from "~/types";

// Query options factories
const collectionsQueryOptions = () => ({
	queryKey: ["bfloorDashboardCollections"],
	queryFn: () => getAllCollections(),
	staleTime: 1000 * 60 * 5,
});

const brandsQueryOptions = () => ({
	queryKey: ["bfloorDashboardBrands"],
	queryFn: () => getAllBrands(),
	staleTime: 1000 * 60 * 5,
});

export const Route = createFileRoute("/dashboard/collections")({
	component: RouteComponent,

	loader: async ({ context: { queryClient } }) => {
		await Promise.all([
			queryClient.ensureQueryData(collectionsQueryOptions()),
			queryClient.ensureQueryData(brandsQueryOptions()),
		]);
	},
});

function RouteComponent() {
	const queryClient = useQueryClient();
	const createFormId = useId();
	const editFormId = useId();
	const createBrandId = useId();
	const editBrandId = useId();

	const { data: collections } = useSuspenseQuery(collectionsQueryOptions());
	const { data: brands } = useSuspenseQuery(brandsQueryOptions());

	const { crud, createForm, editForm } = useDashboardForm<CollectionFormData>(
		{
			name: "",
			slug: "",
			brandSlug: null,
			image: "",
			isActive: true,
		},
		{ listenToActionButton: true },
	);

	const [isCreateAutoSlug, setIsCreateAutoSlug] = useState(true);
	const [isEditAutoSlug, setIsEditAutoSlug] = useState(false);
	const [editingCollectionId, setEditingCollectionId] = useState<number | null>(
		null,
	);
	const [deletingCollectionId, setDeletingCollectionId] = useState<
		number | null
	>(null);

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
			await createCollection({
				data: {
					data: createForm.formData,
				},
			});

			toast.success("Коллекция создана успешно!");
			closeCreateDrawer();
			queryClient.invalidateQueries({
				queryKey: ["bfloorDashboardCollections"],
			});
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : "Произошла ошибка";
			crud.setError(errorMsg);
			toast.error(errorMsg);
		} finally {
			crud.stopSubmitting();
		}
	};

	const closeCreateDrawer = () => {
		crud.closeCreateDrawer();
		createForm.resetForm();
		setIsCreateAutoSlug(true);
	};

	const handleEditCollection = (collection: Collection) => {
		setEditingCollectionId(collection.id);

		const isCustomSlug = collection.slug !== generateSlug(collection.name);

		editForm.setFormData({
			name: collection.name,
			slug: collection.slug,
			brandSlug: collection.brandSlug || null,
			image: collection.image || "",
			isActive: collection.isActive,
		});
		setIsEditAutoSlug(!isCustomSlug);
		crud.openEditDrawer();
	};

	const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!editingCollectionId) return;

		crud.startSubmitting();

		try {
			await updateCollection({
				data: {
					id: editingCollectionId,
					data: editForm.formData,
				},
			});

			toast.success("Коллекция обновлена успешно!");
			closeEditDrawer();
			queryClient.invalidateQueries({
				queryKey: ["bfloorDashboardCollections"],
			});
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : "Произошла ошибка";
			crud.setError(errorMsg);
			toast.error(errorMsg);
		} finally {
			crud.stopSubmitting();
		}
	};

	const closeEditDrawer = () => {
		crud.closeEditDrawer();
		setEditingCollectionId(null);
		editForm.resetForm();
		setIsEditAutoSlug(false);
	};

	const handleDeleteClick = (collection: Collection) => {
		setDeletingCollectionId(collection.id);
		crud.openDeleteDialog();
	};

	const handleDeleteConfirm = async () => {
		if (!deletingCollectionId) return;

		crud.startDeleting();

		try {
			await deleteCollection({
				data: { data: { id: deletingCollectionId } },
			});

			toast.success("Коллекция удалена успешно!");
			crud.closeDeleteDialog();
			setDeletingCollectionId(null);
			queryClient.invalidateQueries({
				queryKey: ["bfloorDashboardCollections"],
			});
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : "Произошла ошибка";
			crud.setError(errorMsg);
			toast.error(errorMsg);
		} finally {
			crud.stopDeleting();
		}
	};

	const handleDeleteCancel = () => {
		crud.closeDeleteDialog();
		setDeletingCollectionId(null);
	};

	return (
		<div className="space-y-6 px-6">

			{/* Collections Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
				{collections.map((collection) => {
					const brand = brands.find((b) => b.slug === collection.brandSlug);
					return (
						<div
							key={collection.id}
							className="border rounded-lg overflow-hidden bg-card hover:shadow-md transition-shadow"
						>
							{/* Collection Image */}
							<div className="aspect-video bg-muted relative">
								{collection.image ? (
									<Image
										src={collection.image}
										alt={collection.name}
										className="w-full h-full object-cover"
									/>
								) : (
									<div className="w-full h-full flex items-center justify-center text-muted-foreground">
										Нет изображения
									</div>
								)}
								{!collection.isActive && (
									<Badge
										variant="secondary"
										className="absolute top-2 right-2"
									>
										Неактивна
									</Badge>
								)}
							</div>

							{/* Collection Info */}
							<div className="p-4 space-y-3">
							<div>
								<h3 className="font-medium truncate">{collection.name}</h3>
								{brand && (
									<p className="text-xs text-muted-foreground">
										Бренд: {brand.name}
									</p>
								)}
							</div>

								{/* Action Buttons */}
								<div className="flex gap-2">
									<Button
										variant="outline"
										size="sm"
										className="flex-1"
										onClick={() => handleEditCollection(collection)}
									>
										Изменить
									</Button>
									<Button
										variant="destructive"
										size="sm"
										className="flex-1"
										onClick={() => handleDeleteClick(collection)}
									>
										Удалить
									</Button>
								</div>
							</div>
						</div>
					);
				})}
			</div>

			{/* Create Collection Drawer */}
			<DashboardFormDrawer
				isOpen={crud.showCreateDrawer}
				onOpenChange={crud.setShowCreateDrawer}
				title="Добавить новую коллекцию"
				formId={createFormId}
				isSubmitting={crud.isSubmitting}
				submitButtonText="Создать коллекцию"
				submittingText="Создание..."
				onCancel={closeCreateDrawer}
				error={
					crud.error && !crud.showEditDrawer ? crud.error : undefined
				}
				layout="single-column"
			>
				<form onSubmit={handleSubmit} id={createFormId} className="contents">
					<DrawerSection maxWidth title="Детали коллекции">
						<div className="space-y-4">
							<Input
								label="Название коллекции"
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
								onSlugChange={(slug) => {
									setIsCreateAutoSlug(false);
									createForm.updateField("slug", slug);
								}}
								onAutoSlugChange={setIsCreateAutoSlug}
								idPrefix="create"
							/>

							<div>
								<label htmlFor={createBrandId} className="block text-sm font-medium mb-1">
									Бренд (необязательно)
								</label>
								<Select
									value={createForm.formData.brandSlug || "none"}
									onValueChange={(value: string) => {
										createForm.updateField(
											"brandSlug",
											value === "none" ? null : value,
										);
									}}
								>
									<SelectTrigger id={createBrandId}>
										<SelectValue placeholder="Выберите бренд (необязательно)" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="none">Нет</SelectItem>
										{brands.map((brand) => (
											<SelectItem key={brand.slug} value={brand.slug}>
												{brand.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<Input
								label="Ссылка на изображение"
								type="text"
								name="image"
								value={createForm.formData.image}
								onChange={createForm.handleChange}
								placeholder="https://example.com/image.jpg"
							/>

							<div className="flex items-center gap-2">
								<Switch
									name="isActive"
									checked={createForm.formData.isActive}
									onChange={createForm.handleChange}
								/>
								<span className="text-sm">Активна</span>
							</div>
						</div>
					</DrawerSection>
				</form>
			</DashboardFormDrawer>

			{/* Edit Collection Drawer */}
			<DashboardFormDrawer
				isOpen={crud.showEditDrawer}
				onOpenChange={crud.setShowEditDrawer}
				title="Изменить коллекцию"
				formId={editFormId}
				isSubmitting={crud.isSubmitting}
				submitButtonText="Обновить коллекцию"
				submittingText="Обновление..."
				onCancel={closeEditDrawer}
				error={
					crud.error && crud.showEditDrawer ? crud.error : undefined
				}
				layout="single-column"
			>
				<form onSubmit={handleUpdate} id={editFormId} className="contents">
					<DrawerSection maxWidth title="Детали коллекции">
						<div className="space-y-4">
							<Input
								label="Название коллекции"
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
								onSlugChange={(slug) => {
									setIsEditAutoSlug(false);
									editForm.updateField("slug", slug);
								}}
								onAutoSlugChange={setIsEditAutoSlug}
								idPrefix="edit"
							/>

							<div>
								<label htmlFor={editBrandId} className="block text-sm font-medium mb-1">
									Бренд (необязательно)
								</label>
								<Select
									value={editForm.formData.brandSlug || "none"}
									onValueChange={(value: string) => {
										editForm.updateField(
											"brandSlug",
											value === "none" ? null : value,
										);
									}}
								>
									<SelectTrigger id={editBrandId}>
										<SelectValue placeholder="Выберите бренд (необязательно)" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="none">Нет</SelectItem>
										{brands.map((brand) => (
											<SelectItem key={brand.slug} value={brand.slug}>
												{brand.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<Input
								label="Ссылка на изображение"
								type="text"
								name="image"
								value={editForm.formData.image}
								onChange={editForm.handleChange}
								placeholder="https://example.com/image.jpg"
							/>

							<div className="flex items-center gap-2">
								<Switch
									name="isActive"
									checked={editForm.formData.isActive}
									onChange={editForm.handleChange}
								/>
								<span className="text-sm">Активна</span>
							</div>
						</div>
					</DrawerSection>
				</form>
			</DashboardFormDrawer>

			{/* Delete Confirmation Dialog */}
			{crud.showDeleteDialog && (
				<DeleteConfirmationDialog
					isOpen={crud.showDeleteDialog}
					onClose={handleDeleteCancel}
					onConfirm={handleDeleteConfirm}
					title="Удалить коллекцию"
					description="Вы уверены, что хотите удалить эту коллекцию? Это действие нельзя отменить."
					isDeleting={crud.isDeleting}
				/>
			)}
		</div>
	);
}

