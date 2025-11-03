import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/shared/Button";
import { Input } from "~/components/ui/shared/input";
import { attributeValuesQueryOptions } from "~/lib/queryOptions";
import { createAttributeValue } from "~/server_functions/dashboard/attributes/createAttributeValue";
import { updateAttributeValue } from "~/server_functions/dashboard/attributes/updateAttributeValue";
import { deleteAttributeValue } from "~/server_functions/dashboard/attributes/deleteAttributeValue";
import type { AttributeValue } from "~/server_functions/dashboard/attributes/getAttributeValues";

interface AttributeValuesManagerProps {
	attributeId: number;
	attributeSlug: string;
}

export default function AttributeValuesManager({
	attributeId,
	attributeSlug,
}: AttributeValuesManagerProps) {
	const queryClient = useQueryClient();
	const [newValue, setNewValue] = useState("");
	const [isCreating, setIsCreating] = useState(false);

	// Fetch attribute values for this attribute
	const { data: values, isLoading, error } = useQuery(
		attributeValuesQueryOptions(attributeId),
	);

	const handleCreateValue = async () => {
		if (!newValue.trim()) {
			toast.error("Значение не может быть пустым");
			return;
		}

		setIsCreating(true);
		try {
			await createAttributeValue({
				data: {
					attributeId,
					value: newValue.trim(),
					slug: null, // Auto-generate slug if needed
				},
			});

			// Invalidate and refetch
			queryClient.invalidateQueries({
				queryKey: ["attributeValues", attributeId],
			});
			queryClient.invalidateQueries({
				queryKey: ["attributeValuesByAttribute"],
			});

			setNewValue("");
			toast.success("Значение добавлено");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Ошибка при добавлении значения",
			);
		} finally {
			setIsCreating(false);
		}
	};

	const handleDeleteValue = async (valueId: number) => {
		if (!confirm("Удалить это значение? Оно будет удалено из всех товаров, которые его используют.")) return;

		try {
			const result = await deleteAttributeValue({ data: { id: valueId } });

			// Invalidate and refetch
			queryClient.invalidateQueries({
				queryKey: ["attributeValues", attributeId],
			});
			queryClient.invalidateQueries({
				queryKey: ["attributeValuesByAttribute"],
			});
			// Also invalidate products to refresh attribute displays
			queryClient.invalidateQueries({
				queryKey: ["products"],
			});

			// Show message with cleanup info
			if (result.updatedProducts > 0) {
				toast.success(
					`Значение удалено. Обновлено товаров: ${result.updatedProducts}`,
				);
			} else {
				toast.success("Значение удалено");
			}
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Ошибка при удалении значения",
			);
		}
	};

	const handleUpdateValue = async (valueId: number, newValueText: string) => {
		if (!newValueText.trim()) {
			toast.error("Значение не может быть пустым");
			return;
		}

		try {
			await updateAttributeValue({
				data: {
					id: valueId,
					data: { value: newValueText.trim() },
				},
			});

			// Invalidate and refetch
			queryClient.invalidateQueries({
				queryKey: ["attributeValues", attributeId],
			});
			queryClient.invalidateQueries({
				queryKey: ["attributeValuesByAttribute"],
			});

			toast.success("Значение обновлено");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Ошибка при обновлении значения",
			);
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-4">
				<Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="p-4 text-center text-destructive text-sm">
				Ошибка загрузки значений
			</div>
		);
	}

	return (
		<div className="space-y-3">
			<div className="text-sm font-medium text-foreground">
				Стандартизированные значения
			</div>

			{/* Existing values list */}
			{values && values.length > 0 ? (
				<div className="space-y-2">
					{values.map((value) => (
						<ValueItem
							key={value.id}
							value={value}
							onUpdate={(newText) => handleUpdateValue(value.id, newText)}
							onDelete={() => handleDeleteValue(value.id)}
						/>
					))}
				</div>
			) : (
				<div className="text-xs text-muted-foreground py-2">
					Нет стандартизированных значений
				</div>
			)}

			{/* Add new value */}
			<div className="flex gap-2">
				<Input
					value={newValue}
					onChange={(e) => setNewValue(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							e.preventDefault();
							handleCreateValue();
						}
					}}
					placeholder="Введите новое значение..."
					className="text-sm flex-1"
					disabled={isCreating}
				/>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={handleCreateValue}
					disabled={isCreating || !newValue.trim()}
				>
					{isCreating ? (
						<Loader2 className="w-4 h-4 animate-spin" />
					) : (
						<Plus className="w-4 h-4" />
					)}
				</Button>
			</div>
		</div>
	);
}

// Component for individual value item with inline editing
function ValueItem({
	value,
	onUpdate,
	onDelete,
}: {
	value: AttributeValue;
	onUpdate: (newValue: string) => void;
	onDelete: () => void;
}) {
	const [isEditing, setIsEditing] = useState(false);
	const [editValue, setEditValue] = useState(value.value);

	const handleSave = () => {
		if (editValue.trim() !== value.value) {
			onUpdate(editValue.trim());
		}
		setIsEditing(false);
	};

	const handleCancel = () => {
		setEditValue(value.value);
		setIsEditing(false);
	};

	return (
		<div className="flex items-center gap-2 p-2 rounded-md border border-border bg-card hover:bg-accent/50 transition-colors">
			{isEditing ? (
				<>
					<Input
						value={editValue}
						onChange={(e) => setEditValue(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								handleSave();
							} else if (e.key === "Escape") {
								handleCancel();
							}
						}}
						className="text-sm flex-1 h-8"
						autoFocus
					/>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={handleSave}
						className="h-8 px-2"
					>
						Сохранить
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={handleCancel}
						className="h-8 px-2"
					>
						Отмена
					</Button>
				</>
			) : (
				<>
					<span
						className="text-sm flex-1 cursor-pointer"
						onClick={() => setIsEditing(true)}
						title="Нажмите для редактирования"
					>
						{value.value}
					</span>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={() => setIsEditing(true)}
						className="h-8 px-2"
					>
						Редактировать
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={onDelete}
						className="h-8 px-2 text-destructive hover:text-destructive"
					>
						<Trash2 className="w-4 h-4" />
					</Button>
				</>
			)}
		</div>
	);
}

