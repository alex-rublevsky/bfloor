import { Switch } from "~/components/ui/shared/Switch";
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

	const handleAttributeToggle = (attributeId: string) => {
		if (selectedAttributes.includes(attributeId)) {
			// Remove attribute
			onChange(selectedAttributes.filter((id) => id !== attributeId));
		} else {
			// Add attribute
			onChange([...selectedAttributes, attributeId]);
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
				</h3>
				<p className="text-sm text-muted-foreground mb-4">
					Выбранные атрибуты будут использоваться для всех вариаций товара
				</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
				{availableAttributes.map((attribute) => {
					const isSelected = selectedAttributes.includes(attribute.id);

					return (
						<div
							key={attribute.id}
							className="flex items-center space-x-3 p-3 border border-border rounded-md hover:bg-muted/50 transition-colors"
						>
							<Switch
								id={`attr-${attribute.id}`}
								checked={isSelected}
								onChange={() => handleAttributeToggle(attribute.id)}
							/>
							<label
								htmlFor={`attr-${attribute.id}`}
								className="flex-1 text-sm font-medium cursor-pointer"
							>
								{attribute.name}
							</label>
						</div>
					);
				})}
			</div>

			{selectedAttributes.length > 0 && (
				<div className="mt-4 p-3 bg-muted/30 rounded-md">
					<p className="text-sm text-muted-foreground">
						Выбрано атрибутов:{" "}
						<span className="font-medium text-foreground">
							{selectedAttributes.length}
						</span>
					</p>
				</div>
			)}
		</div>
	);
}
