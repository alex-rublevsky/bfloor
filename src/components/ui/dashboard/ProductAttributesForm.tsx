import { useState } from "react";
import { Button } from "~/components/ui/shared/Button";
import { Input } from "~/components/ui/shared/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/shared/Select";
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

	const [availableAttributeNames] = useState<string[]>(
		availableAttributes?.map((attr) => attr.name) || [],
	);

	const handleAddAttribute = (attributeId: string) => {
		// Check if attribute already exists
		const attributeExists = attributes?.some(
			(attr) => attr.attributeId === attributeId,
		);

		if (!attributeExists) {
			const newAttributes = [...(attributes || []), { attributeId, value: "" }];
			onChange(newAttributes);
		}
	};

	const handleRemoveAttribute = (attributeId: string) => {
		const newAttributes = (attributes || []).filter(
			(attr) => attr.attributeId !== attributeId,
		);
		onChange(newAttributes);
	};

	const handleUpdateAttributeValue = (attributeId: string, value: string) => {
		const newAttributes = (attributes || []).map((attr) =>
			attr.attributeId === attributeId ? { ...attr, value } : attr,
		);
		onChange(newAttributes);
	};

	// Get unused attributes
	const getUnusedAttributes = () => {
		const usedAttributeIds = (attributes || []).map((attr) => attr.attributeId);
		return availableAttributeNames.filter(
			(attr) => !usedAttributeIds.includes(attr),
		);
	};

	const unusedAttributes = getUnusedAttributes();

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h3 className="text-lg font-semibold">Product Attributes</h3>
				{unusedAttributes.length > 0 && (
					<Select onValueChange={handleAddAttribute}>
						<SelectTrigger className="w-48">
							<SelectValue placeholder="Add attribute" />
						</SelectTrigger>
						<SelectContent>
							{unusedAttributes.map((attr) => (
								<SelectItem key={attr} value={attr}>
									{attr}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				)}
			</div>

			{(attributes || []).length === 0 ? (
				<p className="text-muted-foreground text-sm">
					No attributes added yet. Add attributes to provide additional product
					information.
				</p>
			) : (
				<div className="space-y-3">
					{(attributes || []).map((attr) => (
						<div
							key={attr.attributeId}
							className="flex items-center gap-3 p-3 border rounded-lg"
						>
							<div className="flex-1">
								<label
									htmlFor={`attr-${attr.attributeId}`}
									className="block text-sm font-medium mb-1"
								>
									{attr.attributeId}
								</label>
								<Input
									id={`attr-${attr.attributeId}`}
									placeholder={`Enter ${attr.attributeId.toLowerCase()} value`}
									value={attr.value}
									onChange={(e) =>
										handleUpdateAttributeValue(attr.attributeId, e.target.value)
									}
								/>
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={() => handleRemoveAttribute(attr.attributeId)}
							>
								Remove
							</Button>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
