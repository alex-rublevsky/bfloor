import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useId, useState } from "react";
import { DashboardFormDrawer } from "~/components/ui/dashboard/DashboardFormDrawer";
import { SlugField } from "~/components/ui/dashboard/SlugField";
import { Button } from "~/components/ui/shared/Button";
import { Input } from "~/components/ui/shared/input";
import { useProductAttributes } from "~/hooks/useProductAttributes";
import { useSlugGeneration } from "~/hooks/useSlugGeneration";
import { createProductAttribute } from "~/server_functions/dashboard/attributes/createProductAttribute";
import { updateProductAttribute } from "~/server_functions/dashboard/attributes/updateProductAttribute";
import type { ProductAttribute } from "~/types";

export const Route = createFileRoute("/dashboard/attributes")({
	component: AttributesPage,
});

function AttributesPage() {
	const { data: attributes } = useProductAttributes();
	const queryClient = useQueryClient();
	const createFormId = useId();
	const editFormId = useId();
	const createNameId = useId();
	const editNameId = useId();

	const [isCreating, setIsCreating] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [editingId, setEditingId] = useState<number | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Create form state
	const [newAttributeName, setNewAttributeName] = useState("");
	const [newAttributeSlug, setNewAttributeSlug] = useState("");
	const [isCreateAutoSlug, setIsCreateAutoSlug] = useState(true);

	// Edit form state
	const [editAttributeName, setEditAttributeName] = useState("");
	const [editAttributeSlug, setEditAttributeSlug] = useState("");
	const [isEditAutoSlug, setIsEditAutoSlug] = useState(false);

	// Slug generation callbacks
	const handleCreateSlugChange = useCallback((slug: string) => {
		setNewAttributeSlug(slug);
	}, []);

	const handleEditSlugChange = useCallback((slug: string) => {
		setEditAttributeSlug(slug);
	}, []);

	// Auto-slug generation
	useSlugGeneration(newAttributeName, isCreateAutoSlug, handleCreateSlugChange);
	useSlugGeneration(editAttributeName, isEditAutoSlug, handleEditSlugChange);

	// Listen for action button clicks from navbar
	useEffect(() => {
		const handleAction = () => {
			setIsCreating(true);
		};

		window.addEventListener("dashboardAction", handleAction);
		return () => window.removeEventListener("dashboardAction", handleAction);
	}, []);

	const handleCreate = async () => {
		if (!newAttributeName.trim()) return;

		setError(null);
		setIsSubmitting(true);
		try {
			await createProductAttribute({
				data: {
					name: newAttributeName.trim(),
					slug: newAttributeSlug.trim(),
				},
			});
			queryClient.invalidateQueries({ queryKey: ["productAttributes"] });
			setNewAttributeName("");
			setNewAttributeSlug("");
			setIsCreateAutoSlug(true);
			setIsCreating(false);
		} catch (error) {
			setError(
				error instanceof Error ? error.message : "Failed to create attribute",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleEdit = async () => {
		if (!editingId || !editAttributeName.trim()) return;

		setIsSubmitting(true);
		try {
			await updateProductAttribute({
				data: {
					id: editingId,
					data: {
						name: editAttributeName.trim(),
						slug: editAttributeSlug.trim(),
					},
				},
			});
			queryClient.invalidateQueries({ queryKey: ["productAttributes"] });
			setIsEditing(false);
			setEditingId(null);
			setEditAttributeName("");
			setEditAttributeSlug("");
			setIsEditAutoSlug(false);
		} catch (error) {
			setError(
				error instanceof Error ? error.message : "Failed to update attribute",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const startEdit = (attribute: ProductAttribute) => {
		setEditingId(attribute.id);
		setEditAttributeName(attribute.name);
		setEditAttributeSlug(attribute.slug);
		setIsEditAutoSlug(false);
		setIsEditing(true);
	};

	const closeCreateDrawer = () => {
		setIsCreating(false);
		setNewAttributeName("");
		setNewAttributeSlug("");
		setIsCreateAutoSlug(true);
		setError(null);
	};

	const closeEditDrawer = () => {
		setIsEditing(false);
		setEditingId(null);
		setEditAttributeName("");
		setEditAttributeSlug("");
		setIsEditAutoSlug(false);
		setError(null);
	};

	return (
		<div className="space-y-6">
			{/* Create Attribute Drawer */}
			<DashboardFormDrawer
				isOpen={isCreating}
				onOpenChange={setIsCreating}
				title="Добавить новый атрибут"
				formId={createFormId}
				isSubmitting={isSubmitting}
				submitButtonText="Create Attribute"
				submittingText="Creating..."
				onCancel={closeCreateDrawer}
				error={error && isCreating ? error : undefined}
				layout="single-column"
			>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						handleCreate();
					}}
					id={createFormId}
					className="space-y-4"
				>
					<Input
						label="Название атрибута"
						id={createNameId}
						type="text"
						name="name"
						value={newAttributeName}
						onChange={(e) => {
							setNewAttributeName(e.target.value);
							setError(null);
						}}
						placeholder="Attribute name (e.g., Размер, Цвет)"
						required
					/>
					<SlugField
						slug={newAttributeSlug}
						name={newAttributeName}
						isAutoSlug={isCreateAutoSlug}
						onSlugChange={setNewAttributeSlug}
						onAutoSlugChange={setIsCreateAutoSlug}
						idPrefix="create-"
					/>
				</form>
			</DashboardFormDrawer>

			{/* Attributes List */}
			<div className="grid gap-4">
				{attributes?.map((attribute) => (
					<div key={attribute.id} className="p-4 border rounded-lg">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-4">
								<div>
									<h3 className="font-medium">{attribute.name}</h3>
									<p className="text-sm text-muted-foreground">
										Slug: {attribute.slug} • ID: {attribute.id}
									</p>
								</div>
							</div>
							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => startEdit(attribute)}
								>
									Edit
								</Button>
							</div>
						</div>
					</div>
				))}
			</div>

			{/* Edit Attribute Drawer */}
			<DashboardFormDrawer
				isOpen={isEditing}
				onOpenChange={setIsEditing}
				title="Изменить атрибут"
				formId={editFormId}
				isSubmitting={isSubmitting}
				submitButtonText="Update Attribute"
				submittingText="Updating..."
				onCancel={closeEditDrawer}
				error={error && isEditing ? error : undefined}
				layout="single-column"
			>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						handleEdit();
					}}
					id={editFormId}
					className="space-y-4"
				>
					<Input
						label="Название атрибута"
						id={editNameId}
						type="text"
						name="name"
						value={editAttributeName}
						onChange={(e) => setEditAttributeName(e.target.value)}
						placeholder="Attribute name"
						required
					/>
					<SlugField
						slug={editAttributeSlug}
						name={editAttributeName}
						isAutoSlug={isEditAutoSlug}
						onSlugChange={setEditAttributeSlug}
						onAutoSlugChange={setIsEditAutoSlug}
						idPrefix="edit-"
					/>
				</form>
			</DashboardFormDrawer>
		</div>
	);
}
