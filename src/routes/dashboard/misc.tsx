import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import DeleteConfirmationDialog from "~/components/ui/dashboard/ConfirmationDialog";
import { DashboardFormDrawer } from "~/components/ui/dashboard/DashboardFormDrawer";
import { DescriptionField } from "~/components/ui/dashboard/DescriptionField";
import { DrawerSection } from "~/components/ui/dashboard/DrawerSection";
import { EntityCardContent } from "~/components/ui/dashboard/EntityCardContent";
import { Button } from "~/components/ui/shared/Button";
import { Input } from "~/components/ui/shared/input";
import { Switch } from "~/components/ui/shared/Switch";
import { Textarea } from "~/components/ui/shared/TextArea";
import { useDashboardForm } from "~/hooks/useDashboardForm";
import { createStoreLocation } from "~/server_functions/dashboard/storeLocations/createStoreLocation";
import { deleteStoreLocation } from "~/server_functions/dashboard/storeLocations/deleteStoreLocation";
import { getAllStoreLocations } from "~/server_functions/dashboard/storeLocations/getAllStoreLocations";
import { updateStoreLocation } from "~/server_functions/dashboard/storeLocations/updateStoreLocation";
import type { StoreLocation, StoreLocationFormData } from "~/types";

const storeLocationsQueryOptions = () => ({
	queryKey: ["bfloorDashboardStoreLocations"],
	queryFn: () => getAllStoreLocations(),
	staleTime: 1000 * 60 * 5,
});

export const Route = createFileRoute("/dashboard/misc")({
	component: RouteComponent,
	loader: async ({ context: { queryClient } }) => {
		await queryClient.ensureQueryData(storeLocationsQueryOptions());
	},
});

function RouteComponent() {
	const queryClient = useQueryClient();
	// Use static IDs to avoid hydration mismatch
	const createFormId = "create-store-location-form";
	const editFormId = "edit-store-location-form";

	const { data: locations } = useSuspenseQuery(storeLocationsQueryOptions());

	const { crud, createForm, editForm } =
		useDashboardForm<StoreLocationFormData>(
			{
				address: "",
				description: "",
				openingHours: "",
				isActive: true,
			},
			{ listenToActionButton: true },
		);

	const [editingId, setEditingId] = useState<number | null>(null);
	const [deletingId, setDeletingId] = useState<number | null>(null);

	// No longer listening for navbar action button since we have our own create button

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		crud.startSubmitting();
		try {
			await createStoreLocation({ data: { data: createForm.formData } });
			toast.success("Address added");
			closeCreateDrawer();
			queryClient.invalidateQueries({
				queryKey: ["bfloorDashboardStoreLocations"],
			});
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : "An error occurred";
			crud.setError(errorMsg);
			toast.error(errorMsg);
		} finally {
			crud.stopSubmitting();
		}
	};

	const closeCreateDrawer = () => {
		crud.closeCreateDrawer();
		createForm.resetForm();
	};

	const handleEdit = (location: StoreLocation) => {
		setEditingId(location.id);
		editForm.setFormData({
			address: location.address,
			description: location.description || "",
			openingHours: location.openingHours || "",
			isActive: location.isActive,
		});
		crud.openEditDrawer();
	};

	const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!editingId) return;
		crud.startSubmitting();
		try {
			await updateStoreLocation({
				data: { id: editingId, data: editForm.formData },
			});
			toast.success("Address updated");
			closeEditDrawer();
			queryClient.invalidateQueries({
				queryKey: ["bfloorDashboardStoreLocations"],
			});
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : "An error occurred";
			crud.setError(errorMsg);
			toast.error(errorMsg);
		} finally {
			crud.stopSubmitting();
		}
	};

	const closeEditDrawer = () => {
		crud.closeEditDrawer();
		setEditingId(null);
		editForm.resetForm();
	};

	const handleDeleteClick = (location: StoreLocation) => {
		setDeletingId(location.id);
		crud.openDeleteDialog();
	};

	const handleDeleteConfirm = async () => {
		if (!deletingId) return;
		crud.startDeleting();
		try {
			await deleteStoreLocation({ data: { data: { id: deletingId } } });
			toast.success("Address deleted");
			crud.closeDeleteDialog();
			setDeletingId(null);
			queryClient.invalidateQueries({
				queryKey: ["bfloorDashboardStoreLocations"],
			});
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
		setDeletingId(null);
	};

	return (
		<div className="space-y-6 px-6 py-6">
			{/* Main grid layout - 3 columns on desktop, 1 column on mobile */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Store Addresses Card */}
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<h3 className="text-lg font-semibold">Адреса магазинов</h3>
						<Button variant="outline" size="sm" onClick={crud.openCreateDrawer}>
							Добавить адрес
						</Button>
					</div>

					{/* Use EntityCardGrid container styling but with custom cards */}
					<div className="border border-border rounded-lg p-4 bg-transparent">
						<div className="grid grid-cols-1 gap-3">
							{locations.map((location) => (
								<div
									key={location.id}
									className="group flex flex-col p-2 rounded-md hover:bg-muted border border-transparent hover:border-border w-full text-left bg-transparent"
									style={{ transition: "var(--transition-standard)" }}
								>
									<div className="flex items-center space-x-2">
										<EntityCardContent
											name={location.address}
											secondaryInfo={location.description || undefined}
											isActive={location.isActive}
											inactiveLabel="Неактивен"
										/>
									</div>
									{location.openingHours && (
										<div className="text-xs text-muted-foreground whitespace-pre-line break-words mt-2 ml-0">
											{location.openingHours}
										</div>
									)}
									<div className="flex gap-2 pt-2 mt-2 border-t border-border">
										<Button
											variant="outline"
											size="sm"
											className="flex-1"
											onClick={(e) => {
												e.stopPropagation();
												handleEdit(location);
											}}
										>
											Редактировать
										</Button>
										<Button
											variant="destructive"
											size="sm"
											className="flex-1"
											onClick={(e) => {
												e.stopPropagation();
												handleDeleteClick(location);
											}}
										>
											Удалить
										</Button>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>

				{/* Placeholder for future cards */}
				<div className="lg:col-span-2 space-y-6">
					{/* Additional cards will be added here in the future */}
				</div>
			</div>

			<DashboardFormDrawer
				isOpen={crud.showCreateDrawer}
				onOpenChange={crud.setShowCreateDrawer}
				title="Добавить адрес"
				formId={createFormId}
				isSubmitting={crud.isSubmitting}
				submitButtonText="Создать"
				submittingText="Создание..."
				onCancel={closeCreateDrawer}
				error={crud.error && !crud.showEditDrawer ? crud.error : undefined}
				layout="single-column"
			>
				<form onSubmit={handleSubmit} id={createFormId} className="contents">
					<DrawerSection maxWidth title="Данные адреса">
						<div className="space-y-4">
							<Input
								label="Адрес"
								type="text"
								name="address"
								value={createForm.formData.address}
								onChange={createForm.handleChange}
								required
							/>
							<DescriptionField
								name="description"
								value={createForm.formData.description}
								onChange={createForm.handleChange}
								placeholder="Дополнительная информация о местоположении..."
							/>
							<Textarea
								label="Часы работы"
								name="openingHours"
								value={createForm.formData.openingHours}
								onChange={createForm.handleChange}
								placeholder="Например:&#10;Пн-Пт: 9:00-18:00&#10;Сб: 10:00-16:00&#10;Вс: выходной"
								rows={4}
							/>
							<div className="flex items-center gap-2">
								<Switch
									name="isActive"
									checked={createForm.formData.isActive}
									onChange={createForm.handleChange}
								/>
								<span className="text-sm">Активен</span>
							</div>
						</div>
					</DrawerSection>
				</form>
			</DashboardFormDrawer>

			<DashboardFormDrawer
				isOpen={crud.showEditDrawer}
				onOpenChange={crud.setShowEditDrawer}
				title="Редактировать адрес"
				formId={editFormId}
				isSubmitting={crud.isSubmitting}
				submitButtonText="Обновить"
				submittingText="Обновление..."
				onCancel={closeEditDrawer}
				error={crud.error && crud.showEditDrawer ? crud.error : undefined}
				layout="single-column"
			>
				<form onSubmit={handleUpdate} id={editFormId} className="contents">
					<DrawerSection maxWidth title="Данные адреса">
						<div className="space-y-4">
							<Input
								label="Адрес"
								type="text"
								name="address"
								value={editForm.formData.address}
								onChange={editForm.handleChange}
								required
							/>
							<DescriptionField
								name="description"
								value={editForm.formData.description}
								onChange={editForm.handleChange}
								placeholder="Дополнительная информация о местоположении..."
							/>
							<Textarea
								label="Часы работы"
								name="openingHours"
								value={editForm.formData.openingHours}
								onChange={editForm.handleChange}
								placeholder="Например:&#10;Пн-Пт: 9:00-18:00&#10;Сб: 10:00-16:00&#10;Вс: выходной"
								rows={4}
							/>
							<div className="flex items-center gap-2">
								<Switch
									name="isActive"
									checked={editForm.formData.isActive}
									onChange={editForm.handleChange}
								/>
								<span className="text-sm">Активен</span>
							</div>
						</div>
					</DrawerSection>
				</form>
			</DashboardFormDrawer>

			{crud.showDeleteDialog && (
				<DeleteConfirmationDialog
					isOpen={crud.showDeleteDialog}
					onClose={handleDeleteCancel}
					onConfirm={handleDeleteConfirm}
					title="Удалить адрес"
					description="Вы уверены, что хотите удалить этот адрес? Это действие нельзя отменить."
					isDeleting={crud.isDeleting}
				/>
			)}
		</div>
	);
}
