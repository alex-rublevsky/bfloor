import { Input } from "~/components/ui/shared/input";
import { Button } from "~/components/ui/shared/Button";
import { CheckboxList } from "~/components/ui/shared/CheckboxList";
import { useProductAttributes } from "~/hooks/useProductAttributes";
import { useQuery } from "@tanstack/react-query";
import { allAttributeValuesByAttributeQueryOptions } from "~/lib/queryOptions";
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
	
	// Fetch all standardized values grouped by attribute ID
	const { data: allAttributeValues } = useQuery(allAttributeValuesByAttributeQueryOptions());

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

	// Handle checkbox selection for standardized attributes
	const handleAttributeValueToggle = (
		attributeId: string,
		valueId: string,
		checked: boolean,
		allowMultiple: boolean,
	) => {
		const currentAttributes = attributes || [];
		const existingAttributeIndex = currentAttributes.findIndex(
			(attr) => attr.attributeId === attributeId,
		);

		const attributeInfo = availableAttributes?.find(
			(a) => a.id.toString() === attributeId,
		);
		if (!attributeInfo) return;

		// Get the value string from the standardized value ID
		const standardizedValues = getStandardizedValues(attributeInfo.id);
		const selectedValue = standardizedValues.find(
			(v) => v.id.toString() === valueId,
		);
		if (!selectedValue) return;

		let newAttributes: ProductAttributeFormData[];

		if (existingAttributeIndex >= 0) {
			const currentAttr = currentAttributes[existingAttributeIndex];
			
			if (allowMultiple) {
				// Multi-value: store as comma-separated string (will be converted to array in backend)
				const currentValues = currentAttr.value
					? currentAttr.value.split(",").map((v) => v.trim()).filter(Boolean)
					: [];
				
				let newValues: string[];
				if (checked) {
					// Add value if not already present
					if (!currentValues.includes(selectedValue.value)) {
						newValues = [...currentValues, selectedValue.value];
					} else {
						newValues = currentValues;
					}
				} else {
					// Remove value
					newValues = currentValues.filter((v) => v !== selectedValue.value);
				}

				const newValue = newValues.length > 0 ? newValues.join(",") : "";
				
				if (newValue) {
					newAttributes = currentAttributes.map((attr) =>
						attr.attributeId === attributeId ? { ...attr, value: newValue } : attr,
					);
				} else {
					// Remove attribute if no values left
					newAttributes = currentAttributes.filter(
						(attr) => attr.attributeId !== attributeId,
					);
				}
			} else {
				// Single-value: replace current value
				if (checked) {
					newAttributes = currentAttributes.map((attr) =>
						attr.attributeId === attributeId
							? { ...attr, value: selectedValue.value }
							: attr,
					);
				} else {
					// Remove attribute if unchecked
					newAttributes = currentAttributes.filter(
						(attr) => attr.attributeId !== attributeId,
					);
				}
			}
		} else {
			// Add new attribute
			if (checked) {
				newAttributes = [
					...currentAttributes,
					{ attributeId, value: selectedValue.value },
				];
			} else {
				newAttributes = currentAttributes;
			}
		}

		onChange(newAttributes);
	};

	// Get selected values for an attribute (for checkbox list)
	// Returns array of value IDs (as strings) that match standardized values
	const getSelectedValues = (attributeId: number): string[] => {
		const attr = attributes?.find((a) => a.attributeId === attributeId.toString());
		if (!attr || !attr.value) return [];
		
		// Handle both comma-separated string and single value
		const values = attr.value.split(",").map((v) => v.trim()).filter(Boolean);
		
		// Convert value strings to standardized value IDs
		const standardizedValues = getStandardizedValues(attributeId);
		const selectedIds: string[] = [];
		
		for (const value of values) {
			const stdValue = standardizedValues.find((sv) => sv.value === value);
			if (stdValue) {
				selectedIds.push(stdValue.id.toString());
			}
		}
		
		return selectedIds;
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

	// Get standardized values for an attribute
	const getStandardizedValues = (attributeId: number) => {
		return allAttributeValues?.[attributeId] || [];
	};

	// Check if attribute has standardized values
	const isStandardizedAttribute = (attributeId: number) => {
		const attribute = availableAttributes?.find((attr) => attr.id === attributeId);
		return attribute?.valueType === "standardized" || attribute?.valueType === "both";
	};

	// Validate if a value is valid for a standardized attribute
	const isValidStandardizedValue = (attributeId: number, value: string): boolean => {
		if (!value) return true; // Empty values are allowed
		const standardizedValues = getStandardizedValues(attributeId);
		return standardizedValues.some((stdValue) => stdValue.value === value);
	};

	// Get validation error for an attribute
	const getAttributeValidationError = (attributeId: string, value: string): string | null => {
		const attributeInfo = availableAttributes?.find(
			(a) => a.id.toString() === attributeId
		);
		if (!attributeInfo) return null;

		const isStandardized = isStandardizedAttribute(attributeInfo.id);
		if (isStandardized && value && !isValidStandardizedValue(attributeInfo.id, value)) {
			return `Значение "${value}" не входит в список стандартизированных значений для этого атрибута`;
		}
		return null;
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
					
					const attributeId = attributeInfo.id;
					const isStandardized = isStandardizedAttribute(attributeId);
					const standardizedValues = isStandardized ? getStandardizedValues(attributeId) : [];
					const validationError = getAttributeValidationError(attr.attributeId, attr.value);
					const hasInvalidValue = isStandardized && attr.value && !isValidStandardizedValue(attributeId, attr.value);
					const allowMultiple = attributeInfo.allowMultipleValues === true;
					const selectedValues = isStandardized ? getSelectedValues(attributeId) : [];
					
					return (
						<div key={attr.attributeId} className="space-y-2">
							<label
								htmlFor={`attr-${attr.attributeId}`}
								className="block text-sm font-medium text-foreground"
							>
								{attributeInfo.name}
								{allowMultiple && (
									<span className="text-xs text-muted-foreground ml-2">
										(можно выбрать несколько)
									</span>
								)}
							</label>
							{isStandardized && standardizedValues.length > 0 ? (
								// Use CheckboxList for standardized attributes
								<div className="space-y-1">
									<CheckboxList
										items={standardizedValues.map((stdValue) => ({
											id: stdValue.id.toString(),
											label: stdValue.value,
											isActive: stdValue.isActive,
										}))}
										selectedIds={selectedValues}
										onItemChange={(valueId, checked) => {
											handleAttributeValueToggle(
												attr.attributeId,
												valueId as string,
												checked,
												allowMultiple,
											);
										}}
										idPrefix={`attr-${attr.attributeId}-value`}
										columns={1}
										showOnlyActive={true}
									/>
									{hasInvalidValue && (
										<p className="text-xs text-destructive mt-1">
											⚠️ {validationError || "Неверное значение. Выберите из списка."}
										</p>
									)}
								</div>
							) : (
								// Use Input for free-text attributes
								<Input
									id={`attr-${attr.attributeId}`}
									value={attr.value}
									onChange={(e) =>
										handleUpdateAttributeValue(attr.attributeId, e.target.value)
									}
									className="text-sm"
									placeholder="Введите значение"
								/>
							)}
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
					
					const isStandardized = isStandardizedAttribute(attributeInfo.id);
					const standardizedValues = isStandardized ? getStandardizedValues(attributeInfo.id) : [];
					const allowMultiple = attributeInfo.allowMultipleValues === true;
					const selectedValues = isStandardized ? getSelectedValues(attributeInfo.id) : [];
					
					return (
						<div key={attributeInfo.id} className="space-y-2">
							<label
								htmlFor={`attr-${attributeInfo.id}`}
								className="block text-sm font-medium text-foreground"
							>
								{attributeInfo.name}
								{allowMultiple && (
									<span className="text-xs text-muted-foreground ml-2">
										(можно выбрать несколько)
									</span>
								)}
							</label>
							{isStandardized && standardizedValues.length > 0 ? (
								// Use CheckboxList for standardized attributes
								<CheckboxList
									items={standardizedValues.map((stdValue) => ({
										id: stdValue.id.toString(),
										label: stdValue.value,
										isActive: stdValue.isActive,
									}))}
									selectedIds={selectedValues}
									onItemChange={(valueId, checked) => {
										handleAttributeValueToggle(
											attributeInfo.id.toString(),
											valueId as string,
											checked,
											allowMultiple,
										);
									}}
									idPrefix={`attr-${attributeInfo.id}-value`}
									columns={1}
									showOnlyActive={true}
								/>
							) : (
								// Use Input for free-text attributes
								<Input
									id={`attr-${attributeInfo.id}`}
									value=""
									onChange={(e) =>
										handleUpdateAttributeValue(attributeInfo.id.toString(), e.target.value)
									}
									className="text-sm"
									placeholder="Введите значение"
								/>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
