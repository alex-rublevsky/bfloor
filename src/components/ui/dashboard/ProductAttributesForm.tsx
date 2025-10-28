import { Input } from "~/components/ui/shared/input";
import { useProductAttributes } from "~/hooks/useProductAttributes";
import type { ProductAttributeFormData } from "~/types";

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

	return (
		<div className="space-y-4">
			<h3 className="text-sm font-medium text-foreground mb-2">
				Атрибуты товара
			</h3>

			<div className="grid grid-cols-2 gap-3">
				{availableAttributes.map((attributeInfo) => {
					// Find the current value for this attribute
					const currentAttribute = (attributes || []).find(
						(attr) => attr.attributeId === attributeInfo.id.toString(),
					);
					const currentValue = currentAttribute?.value || "";

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
								value={currentValue}
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
