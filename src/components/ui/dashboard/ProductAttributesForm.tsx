import { Input } from "~/components/ui/shared/input";
import { Button } from "~/components/ui/shared/Button";
import { useProductAttributes } from "~/hooks/useProductAttributes";
import type { ProductAttributeFormData } from "~/types";
import { cn } from "~/lib/utils";
import { Trash2, AlertCircle } from "lucide-react";

interface ProductAttributesFormProps {
	attributes?: ProductAttributeFormData[];
	onChange: (attributes: ProductAttributeFormData[]) => void;
}

export default function ProductAttributesForm({
	attributes,
	onChange,
}: ProductAttributesFormProps) {
	const { data: availableAttributes, isLoading, error } = useProductAttributes();

	const handleUpdateAttributeValue = (attributeId: string, value: string) => {
		const currentAttributes = attributes || [];
		const existingAttributeIndex = currentAttributes.findIndex(
			(attr) => attr.attributeId === attributeId,
		);

		let newAttributes: ProductAttributeFormData[];
		if (existingAttributeIndex >= 0) {
			// Update existing attribute
			newAttributes = currentAttributes.map((attr) =>
				attr.attributeId === attributeId ? { ...attr, value } : attr,
			);
		} else {
			// Add new attribute
			newAttributes = [...currentAttributes, { attributeId, value }];
		}

		onChange(newAttributes);
	};

	const handleDeleteAttribute = (attributeId: string) => {
		const currentAttributes = attributes || [];
		onChange(currentAttributes.filter((attr) => attr.attributeId !== attributeId));
	};

	// Check if an attribute is out of scope (not in predefined attributes)
	const isOutOfScopeAttribute = (attributeId: string) => {
		return !availableAttributes?.some((attr) => attr.id.toString() === attributeId);
	};

	// Get the display name for an attribute
	const getAttributeDisplayName = (attributeId: string) => {
		const attribute = availableAttributes?.find((attr) => attr.id.toString() === attributeId);
		return attribute ? attribute.name : attributeId;
	};

	if (isLoading) {
		return (
			<div className="p-4 text-center text-muted-foreground">
				<p>Загрузка атрибутов...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="p-4 text-center text-destructive">
				<p>Ошибка загрузки атрибутов</p>
			</div>
		);
	}

	if (!availableAttributes || availableAttributes.length === 0) {
		return (
			<div className="p-4 text-center text-muted-foreground">
				<p>Нет доступных атрибутов</p>
				<p className="text-sm mt-1">Создайте атрибуты в разделе "Атрибуты"</p>
			</div>
		);
	}

	// Separate attributes into predefined and out-of-scope
	const predefinedAttributes = attributes?.filter((attr) => !isOutOfScopeAttribute(attr.attributeId)) || [];
	const outOfScopeAttributes = attributes?.filter((attr) => isOutOfScopeAttribute(attr.attributeId)) || [];

	return (
		<div className="space-y-4">
			<h3 className="text-sm font-medium text-foreground mb-2">
				Атрибуты товара
			</h3>

			{/* Out-of-scope attributes (from old database) */}
			{outOfScopeAttributes.length > 0 && (
				<div className="space-y-3">
					<div className="flex items-center gap-2 text-xs font-medium text-amber-600 dark:text-amber-400">
						<AlertCircle className="h-4 w-4" />
						<span>Атрибуты из старой базы данных</span>
					</div>
				{outOfScopeAttributes.map((attr) => (
					<div
						key={attr.attributeId}
						className="rounded-md border border-destructive/40 bg-destructive/10 p-3 shadow-sm"
					>
						<div className="flex items-start justify-between gap-2">
							<div className="flex items-center gap-2 text-destructive">
								<AlertCircle className="h-4 w-4" />
								<label
									htmlFor={`out-of-scope-${attr.attributeId}`}
									className="block text-sm font-medium"
								>
									{getAttributeDisplayName(attr.attributeId)}
								</label>
							</div>
							<Button
								type="button"
								variant="destructive"
								size="sm"
								onClick={() => handleDeleteAttribute(attr.attributeId)}
								className="shrink-0"
							>
								<Trash2 className="h-4 w-4 mr-1" />
								<span>Удалить</span>
							</Button>
						</div>
						<div className="mt-2">
							<Input
								id={`out-of-scope-${attr.attributeId}`}
								value={attr.value}
								onChange={(e) =>
									handleUpdateAttributeValue(attr.attributeId, e.target.value)
								}
								className={cn(
									"text-sm",
									"bg-destructive/5 border-destructive/30 focus-visible:ring-destructive"
								)}
								placeholder="Введите значение"
							/>
						</div>
					</div>
				))}
					<div className="border-t border-amber-200 dark:border-amber-900" />
				</div>
			)}

			{/* Predefined attributes */}
			{predefinedAttributes.length > 0 && (() => {
				const leftCount = Math.ceil(predefinedAttributes.length / 2);
				const left = predefinedAttributes.slice(0, leftCount);
				const right = predefinedAttributes.slice(leftCount);
				const renderItem = (attr: typeof predefinedAttributes[number]) => {
					const attributeInfo = availableAttributes?.find(
						(a) => a.id.toString() === attr.attributeId
					);
					if (!attributeInfo) return null;
					return (
						<div key={attr.attributeId} className="space-y-1">
							<label
								htmlFor={`attr-${attr.attributeId}`}
								className="block text-sm font-medium text-foreground"
							>
								{attributeInfo.name}
							</label>
							<Input
								id={`attr-${attr.attributeId}`}
								value={attr.value}
								onChange={(e) =>
									handleUpdateAttributeValue(attr.attributeId, e.target.value)
								}
								className="text-sm"
								placeholder="Введите значение"
							/>
						</div>
					);
				};
				return (
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-3">
							{left.map((attr) => renderItem(attr))}
						</div>
						<div className="space-y-3">
							{right.map((attr) => renderItem(attr))}
						</div>
					</div>
				);
			})()}

			{/* Show all available attributes to allow adding them */}
			<div className="grid grid-cols-2 gap-3">
				{availableAttributes.map((attributeInfo) => {
					// Find the current value for this attribute
					const currentAttribute = (attributes || []).find(
						(attr) => attr.attributeId === attributeInfo.id.toString(),
					);
					
					// Only show attributes that aren't already in the product
					if (currentAttribute) return null;
					
					return (
						<div key={attributeInfo.id} className="space-y-1">
							<label
								htmlFor={`attr-${attributeInfo.id}`}
								className="block text-sm font-medium text-foreground"
							>
								{attributeInfo.name}
							</label>
							<Input
								id={`attr-${attributeInfo.id}`}
								value=""
								onChange={(e) =>
									handleUpdateAttributeValue(attributeInfo.id.toString(), e.target.value)
								}
								className="text-sm"
								placeholder="Введите значение"
							/>
						</div>
					);
				})}
			</div>
		</div>
	);
}
