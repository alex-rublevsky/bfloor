import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useId, useState } from "react";
import { toast } from "sonner";
import DeleteConfirmationDialog from "~/components/ui/dashboard/ConfirmationDialog";
import { DashboardFormDrawer } from "~/components/ui/dashboard/DashboardFormDrawer";
import { DescriptionField } from "~/components/ui/dashboard/DescriptionField";
import { DrawerSection } from "~/components/ui/dashboard/DrawerSection";
import { Button } from "~/components/ui/shared/Button";
import { Input } from "~/components/ui/shared/input";
import { Switch } from "~/components/ui/shared/Switch";
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
	const createFormId = useId();
	const editFormId = useId();

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
		<div className="space-y-6 px-6">

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
				{locations.map((loc) => (
					<div key={loc.id} className="border rounded-lg p-4 bg-card space-y-3">
						<div className="space-y-1">
							<div className="font-medium break-words">{loc.address}</div>
							{loc.description && (
								<div className="text-sm text-muted-foreground break-words">
									{loc.description}
								</div>
							)}
							{loc.openingHours && (
								<div className="text-sm text-muted-foreground break-words">
									{loc.openingHours}
								</div>
							)}
							{!loc.isActive && (
								<div className="text-xs text-muted-foreground">Неактивен</div>
							)}
						</div>
						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								className="flex-1"
								onClick={() => handleEdit(loc)}
							>
								Редактировать
							</Button>
							<Button
								variant="destructive"
								size="sm"
								className="flex-1"
								onClick={() => handleDeleteClick(loc)}
							>
								Удалить
							</Button>
						</div>
					</div>
				))}
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
							<Input
								label="Часы работы"
								type="text"
								name="openingHours"
								value={createForm.formData.openingHours}
								onChange={createForm.handleChange}
								placeholder="Например: Пн-Пт: 9:00-18:00, Сб: 10:00-16:00"
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
							<Input
								label="Часы работы"
								type="text"
								name="openingHours"
								value={editForm.formData.openingHours}
								onChange={editForm.handleChange}
								placeholder="Например: Пн-Пт: 9:00-18:00, Сб: 10:00-16:00"
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
