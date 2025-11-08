import { CheckboxList } from "~/components/ui/shared/CheckboxList";
import { useProductAttributes } from "~/hooks/useProductAttributes";

interface ProductVariationAttributesSelectorProps {
	selectedAttributes: string[]; // Array of attribute IDs that are selected
	onChange: (selectedAttributes: string[]) => void;
}

export default function ProductVariationAttributesSelector({
	selectedAttributes,
	onChange,
}: ProductVariationAttributesSelectorProps) {
	const { data: availableAttributes } = useProductAttributes();

	const handleAttributeChange = (itemId: string | number, checked: boolean) => {
		const attributeId = itemId.toString();
		if (checked) {
			// Add attribute
			onChange([...selectedAttributes, attributeId]);
		} else {
			// Remove attribute
			onChange(selectedAttributes.filter((id) => id !== attributeId));
		}
	};

	if (!availableAttributes || availableAttributes.length === 0) {
		return (
			<div className="p-4 border border-dashed border-border rounded-md text-center text-muted-foreground">
				<p>Нет доступных атрибутов для вариаций</p>
				<p className="text-sm mt-1">Создайте атрибуты в разделе "Атрибуты"</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div>
				<h3 className="text-sm font-medium text-foreground mb-3">
					Выберите атрибуты для вариаций
					{selectedAttributes.length > 0 && (
						<sup className="ml-1 font-normal text-primary">
							{selectedAttributes.length}
						</sup>
					)}
				</h3>
				<p className="text-sm text-muted-foreground mb-4">
					Выбранные атрибуты будут использоваться для всех вариаций товара
				</p>
			</div>

			<CheckboxList
				items={availableAttributes.map((attribute) => ({
					id: attribute.id.toString(),
					label: attribute.name,
					isActive: attribute.isActive,
				}))}
				selectedIds={selectedAttributes}
				onItemChange={handleAttributeChange}
				idPrefix="variation-attr"
				columns={3}
			/>
		</div>
	);
}
