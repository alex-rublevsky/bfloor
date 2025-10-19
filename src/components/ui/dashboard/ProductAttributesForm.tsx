import { useEffect } from "react";
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
	const { data: availableAttributes } = useProductAttributes();

	// Ensure all available attributes are always present
	useEffect(() => {
		if (availableAttributes && availableAttributes.length > 0) {
			const currentAttributeIds = (attributes || []).map(
				(attr) => attr.attributeId,
			);
			const missingAttributes = availableAttributes
				.filter((attr) => !currentAttributeIds.includes(attr.id.toString()))
				.map((attr) => ({ attributeId: attr.id.toString(), value: "" }));

			if (missingAttributes.length > 0) {
				onChange([...(attributes || []), ...missingAttributes]);
			}
		}
	}, [availableAttributes, attributes, onChange]);

	const handleUpdateAttributeValue = (attributeId: string, value: string) => {
		const newAttributes = (attributes || []).map((attr) =>
			attr.attributeId === attributeId ? { ...attr, value } : attr,
		);
		onChange(newAttributes);
	};

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
				{(attributes || []).map((attr) => {
					const attributeInfo = availableAttributes.find(
						(a) => a.id.toString() === attr.attributeId,
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
							/>
						</div>
					);
				})}
			</div>
		</div>
	);
}
