import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useId, useState } from "react";
import { toast } from "sonner";
import DeleteConfirmationDialog from "~/components/ui/dashboard/ConfirmationDialog";
import { DashboardFormDrawer } from "~/components/ui/dashboard/DashboardFormDrawer";
import { DrawerSection } from "~/components/ui/dashboard/DrawerSection";
import { EntityCardContent } from "~/components/ui/dashboard/EntityCardContent";
import { EntityCardGrid } from "~/components/ui/dashboard/EntityCardGrid";
import { ImageUpload } from "~/components/ui/dashboard/ImageUpload";
import { Button } from "~/components/ui/shared/Button";
import { EmptyState } from "~/components/ui/shared/EmptyState";
import { Image } from "~/components/ui/shared/Image";
import { Input } from "~/components/ui/shared/input";
import { Switch } from "~/components/ui/shared/Switch";
import { useDashboardForm } from "~/hooks/useDashboardForm";
import { countriesQueryOptions } from "~/lib/queryOptions";
import { createCountry } from "~/server_functions/dashboard/countries/createCountry";
import { deleteCountry } from "~/server_functions/dashboard/countries/deleteCountry";
import { updateCountry } from "~/server_functions/dashboard/countries/updateCountry";
import { deleteProductImage } from "~/server_functions/dashboard/store/deleteProductImage";
import type { Country, CountryFormData } from "~/types";
import { Trash } from "../shared/Icon";

interface CountriesManagerProps {
	className?: string;
}

export function CountriesManager({ className }: CountriesManagerProps) {
	const queryClient = useQueryClient();
	const createFormId = useId();
	const editFormId = useId();

	// Fetch countries data
	const { data: countries = [] } = useSuspenseQuery(countriesQueryOptions());

	// Form state management
	const form = useDashboardForm<CountryFormData>(
		{
			name: "",
			code: "",
			flagImage: "",
			isActive: true,
		},
		{
			listenToActionButton: false, // Don't listen to navbar action button
		},
	);

	const [editingCountryId, setEditingCountryId] = useState<number | null>(null);
	const [deletingCountryId, setDeletingCountryId] = useState<number | null>(
		null,
	);
	const [originalFlagImage, setOriginalFlagImage] = useState<string>("");
	const [deletedFlagImages, setDeletedFlagImages] = useState<string[]>([]);

	// Submit handler for creating countries
	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		form.crud.startSubmitting();

		try {
			const formData = form.createForm.formData as CountryFormData;
			await createCountry({ data: formData });

			toast.success("Страна добавлена успешно!");

			// Refresh the countries query
			queryClient.invalidateQueries({
				queryKey: ["bfloorCountries"],
			});

			closeCreateDrawer();
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : "An error occurred";
			form.crud.setError(errorMsg);
			toast.error(errorMsg);
		} finally {
			form.crud.stopSubmitting();
		}
	};

	const closeCreateDrawer = () => {
		form.crud.closeCreateDrawer();
		form.createForm.resetForm();
	};

	// Handler for editing countries
	const handleEditCountry = (country: Country) => {
		setEditingCountryId(country.id);
		setOriginalFlagImage(country.flagImage || "");
		setDeletedFlagImages([]);
		form.editForm.setFormData({
			name: country.name,
			code: country.code,
			flagImage: country.flagImage || "",
			isActive: country.isActive ?? true,
		});
		form.crud.openEditDrawer();
	};

	// Handler for updating countries
	const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!editingCountryId) return;

		form.crud.startSubmitting();

		try {
			// For countries, flagImage is a single string (not comma-separated)
			// Compare original and new flag images to determine what was added/removed
			const originalImage = originalFlagImage?.trim() || "";
			const newImage = form.editForm.formData.flagImage?.trim() || "";

			console.log("Country update - image tracking:", {
				originalImage,
				newImage,
				deletedFlagImages,
				areDifferent: originalImage !== newImage,
				originalLength: originalImage.length,
				newLength: newImage.length,
			});

			// Comprehensive image tracking:
			// 1. Images explicitly deleted via UI (in deletedFlagImages)
			// 2. Images in original but not in new (replaced or removed)
			const removedImages: string[] = [];

			// ALWAYS check: if there was an original image and it's different from the new one, it was removed/replaced
			// This handles the most common case: user deletes old image and adds new one
			if (originalImage && originalImage !== newImage) {
				removedImages.push(originalImage);
				console.log(
					`Detected removed image: ${originalImage} (replaced with: ${newImage || "none"})`,
				);
			}

			// Also check if original exists but new is empty (user removed image without adding new one)
			if (originalImage && !newImage) {
				// Already handled above, but make sure it's in the list
				if (!removedImages.includes(originalImage)) {
					removedImages.push(originalImage);
					console.log(
						`Detected removed image: ${originalImage} (no replacement)`,
					);
				}
			}

			// Combine explicitly deleted images with automatically detected removed images
			const allImagesToDelete = [
				...new Set([...deletedFlagImages, ...removedImages]),
			];

			console.log("Images to delete:", {
				explicitlyDeleted: deletedFlagImages,
				detectedRemoved: removedImages,
				allToDelete: allImagesToDelete,
				totalCount: allImagesToDelete.length,
			});

			// Delete images from R2 before updating
			if (allImagesToDelete.length > 0) {
				console.log(
					`Starting deletion of ${allImagesToDelete.length} image(s) from R2...`,
				);
				const deleteResults = await Promise.allSettled(
					allImagesToDelete.map(async (filename) => {
						try {
							const result = await deleteProductImage({ data: { filename } });
							console.log(`Successfully deleted ${filename}:`, result);
							return { filename, success: true };
						} catch (error) {
							console.error(`Failed to delete ${filename}:`, error);
							return { filename, success: false, error };
						}
					}),
				);

				const successful = deleteResults.filter(
					(r) => r.status === "fulfilled" && r.value.success,
				).length;
				const failed = deleteResults.filter(
					(r) =>
						r.status === "rejected" ||
						(r.status === "fulfilled" && !r.value.success),
				).length;
				console.log(
					`Deletion complete: ${successful} succeeded, ${failed} failed`,
				);
			} else {
				console.log("No images to delete");
			}

			await updateCountry({
				data: {
					id: editingCountryId,
					data: form.editForm.formData as CountryFormData,
				},
			});

			toast.success("Страна обновлена успешно!");

			// Refresh the countries query
			queryClient.invalidateQueries({
				queryKey: ["bfloorCountries"],
			});

			closeEditModal();
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : "An error occurred";
			form.crud.setError(errorMsg);
			toast.error(errorMsg);
		} finally {
			form.crud.stopSubmitting();
		}
	};

	const closeEditModal = () => {
		form.crud.closeEditDrawer();
		setEditingCountryId(null);
		setOriginalFlagImage("");
		setDeletedFlagImages([]);
		form.editForm.resetForm();
	};

	// Handler for deleting countries
	const handleDeleteCountryClick = (country: Country) => {
		setDeletingCountryId(country.id);
		form.crud.openDeleteDialog();
	};

	const handleDeleteConfirm = async () => {
		if (!deletingCountryId) return;

		form.crud.startDeleting();

		try {
			await deleteCountry({ data: { id: deletingCountryId } });

			toast.success("Страна удалена успешно!");

			// Refresh the countries query
			queryClient.invalidateQueries({
				queryKey: ["bfloorCountries"],
			});

			// Close both the delete dialog and the edit drawer (if open)
			form.crud.closeDeleteDialog();
			form.crud.closeEditDrawer();
			setDeletingCountryId(null);
			setEditingCountryId(null);
			setOriginalFlagImage("");
			setDeletedFlagImages([]);
			form.editForm.resetForm();
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : "An error occurred";
			form.crud.setError(errorMsg);
			toast.error(errorMsg);
		} finally {
			form.crud.stopDeleting();
		}
	};

	const handleDeleteCancel = () => {
		form.crud.closeDeleteDialog();
		setDeletingCountryId(null);
	};

	return (
		<div className={className}>
			{/* Header with Create Button */}
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-lg font-semibold">Страны</h2>
				<Button
					type="button"
					onClick={() => form.crud.openCreateDrawer()}
					variant="default"
				>
					Добавить страну
				</Button>
			</div>

			{/* Countries List */}
			{countries.length === 0 ? (
				<EmptyState
					entityType="countries"
					actionButton={{
						text: "Добавить страну",
						onClick: () => form.crud.openCreateDrawer(),
					}}
				/>
			) : (
				<EntityCardGrid
					entities={countries}
					onEdit={handleEditCountry}
					renderEntity={(country) => {
						const flagIcon = country.flagImage ? (
							<div className="h-8 w-8 relative">
								<Image
									src={country.flagImage}
									alt={country.name}
									className="object-contain rounded"
									width={32}
								/>
							</div>
						) : (
							<div className="h-8 w-8 bg-muted rounded flex items-center justify-center">
								<span className="text-xs text-muted-foreground">
									{country.code}
								</span>
							</div>
						);

						return (
							<EntityCardContent
								name={country.name}
								slug={country.code}
								isActive={country.isActive}
								icon={flagIcon}
								inactiveLabel="Inactive"
							/>
						);
					}}
				/>
			)}

			{/* Create Country Drawer */}
			<DashboardFormDrawer
				isOpen={form.crud.showCreateDrawer}
				onOpenChange={form.crud.setShowCreateDrawer}
				title="Добавить новую страну"
				formId={createFormId}
				isSubmitting={form.crud.isSubmitting}
				submitButtonText="Создать страну"
				submittingText="Создание..."
				onCancel={closeCreateDrawer}
				error={
					form.crud.error && !form.crud.showEditDrawer
						? form.crud.error
						: undefined
				}
				layout="single-column"
			>
				<form onSubmit={handleSubmit} id={createFormId} className="contents">
					<DrawerSection maxWidth>
						<div className="space-y-4">
							<Input
								label="Название страны"
								type="text"
								name="name"
								value={form.createForm.formData.name}
								onChange={form.createForm.handleChange}
								required
							/>

							<Input
								label="Код страны (ISO)"
								type="text"
								name="code"
								value={form.createForm.formData.code}
								onChange={form.createForm.handleChange}
								required
								placeholder="RU, DE, IT, etc."
							/>

							{/* Flag Image Upload */}
							<div>
								<ImageUpload
									currentImages={form.createForm.formData.flagImage || ""}
									onImagesChange={(images) =>
										form.createForm.updateField("flagImage", images)
									}
									folder="country-flags"
									slug={form.createForm.formData.code}
									productName={form.createForm.formData.name}
									label="Флаг страны (опционально)"
								/>
							</div>

							<div className="flex items-center gap-2">
								<Switch
									name="isActive"
									checked={form.createForm.formData.isActive}
									onChange={form.createForm.handleChange}
								/>
								<span className="text-sm">Активна</span>
							</div>
						</div>
					</DrawerSection>
				</form>
			</DashboardFormDrawer>

			{/* Edit Country Drawer */}
			<DashboardFormDrawer
				isOpen={form.crud.showEditDrawer}
				onOpenChange={form.crud.setShowEditDrawer}
				title="Редактировать страну"
				formId={editFormId}
				isSubmitting={form.crud.isSubmitting}
				submitButtonText="Обновить страну"
				submittingText="Обновление..."
				onCancel={closeEditModal}
				error={
					form.crud.error && form.crud.showEditDrawer
						? form.crud.error
						: undefined
				}
				layout="single-column"
			>
				<form onSubmit={handleUpdate} id={editFormId} className="contents">
					<DrawerSection maxWidth>
						<div className="space-y-4">
							<Input
								label="Название страны"
								type="text"
								name="name"
								value={form.editForm.formData.name}
								onChange={form.editForm.handleChange}
								required
							/>

							<Input
								label="Код страны (ISO)"
								type="text"
								name="code"
								value={form.editForm.formData.code}
								onChange={form.editForm.handleChange}
								required
								placeholder="RU, DE, IT, etc."
							/>

							{/* Flag Image Upload */}
							<div>
								<ImageUpload
									currentImages={form.editForm.formData.flagImage || ""}
									onImagesChange={(images, deletedImages) => {
										console.log("ImageUpload onImagesChange:", {
											images,
											deletedImages,
											currentDeletedFlagImages: deletedFlagImages,
										});
										form.editForm.updateField("flagImage", images);
										if (deletedImages && deletedImages.length > 0) {
											setDeletedFlagImages((prev) => {
												const combined = [
													...new Set([...prev, ...deletedImages]),
												];
												console.log("Updated deletedFlagImages:", {
													prev,
													newDeleted: deletedImages,
													combined,
												});
												return combined;
											});
										}
									}}
									folder="country-flags"
									slug={form.editForm.formData.code}
									productName={form.editForm.formData.name}
									label="Флаг страны (опционально)"
								/>
							</div>

							<div className="flex items-center gap-2">
								<Switch
									name="isActive"
									checked={form.editForm.formData.isActive}
									onChange={form.editForm.handleChange}
								/>
								<span className="text-sm">Активна</span>
							</div>
						</div>
					</DrawerSection>

					{/* Delete Button Section */}
					<DrawerSection maxWidth>
						<div className="pt-4 border-t border-border">
							<Button
								type="button"
								variant="destructive"
								onClick={() => {
									if (editingCountryId) {
										const country = countries.find(
											(c) => c.id === editingCountryId,
										);
										if (country) {
											handleDeleteCountryClick(country);
										}
									}
								}}
								className="w-full"
							>
								<Trash size={16} className="mr-2" />
								Удалить страну
							</Button>
						</div>
					</DrawerSection>
				</form>
			</DashboardFormDrawer>

			{form.crud.showDeleteDialog && (
				<DeleteConfirmationDialog
					isOpen={form.crud.showDeleteDialog}
					onClose={handleDeleteCancel}
					onConfirm={handleDeleteConfirm}
					title="Удалить страну"
					description="Вы уверены, что хотите удалить эту страну? Это действие нельзя отменить."
					isDeleting={form.crud.isDeleting}
				/>
			)}
		</div>
	);
}
