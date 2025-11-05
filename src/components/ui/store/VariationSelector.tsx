import { useCallback } from "react";
import {
	getAttributeDisplayName,
	useProductAttributes,
} from "~/hooks/useProductAttributes";
import type { ProductWithVariations, VariationAttribute } from "~/types";

interface VariationSelectorProps {
	product: ProductWithVariations;
	selectedAttributes: Record<string, string> | null;
	search: Record<string, string | undefined>;
	onAttributeChange: (attributeId: string, value: string) => void;
}

export function VariationSelector({
	product,
	selectedAttributes,
	onAttributeChange,
}: VariationSelectorProps) {
	const { data: attributes } = useProductAttributes();

	// Get all unique attributes for this product
	const availableAttributes = useCallback(() => {
		if (!product.variations || product.variations.length === 0) return [];

		const attributeMap = new Map<string, Set<string>>();

		product.variations.forEach((variation) => {
			variation.attributes.forEach((attr: VariationAttribute) => {
				if (!attributeMap.has(attr.attributeId)) {
					attributeMap.set(attr.attributeId, new Set());
				}
				attributeMap.get(attr.attributeId)?.add(attr.value);
			});
		});

		return Array.from(attributeMap.entries()).map(([attributeId, values]) => ({
			attributeId,
			displayName: getAttributeDisplayName(attributeId, attributes || []),
			values: Array.from(values).sort(),
		}));
	}, [product.variations, attributes]);

	const productAttributes = availableAttributes();

	const handleAttributeChange = useCallback(
		(attributeId: string, value: string) => {
			onAttributeChange(attributeId, value);
		},
		[onAttributeChange],
	);

	if (productAttributes.length === 0) {
		return null;
	}

	return (
		<>
			{productAttributes.map(({ attributeId, displayName, values }) => (
				<div key={attributeId} className="space-y-2">
					<div className="text-sm font-medium text-gray-700">{displayName}</div>
					<div className="flex flex-wrap gap-2">
						{values.map((value) => {
							const isSelected = selectedAttributes?.[attributeId] === value;
							return (
								<button
									key={value}
									type="button"
									onClick={() => handleAttributeChange(attributeId, value)}
									className={`px-3 py-2 text-sm rounded-md border transition-colors ${
										isSelected
											? "bg-red-600 text-white border-red-600"
											: "bg-white text-gray-700 border-gray-300 hover:border-red-300 hover:bg-red-50"
									}`}
								>
									{value}
								</button>
							);
						})}
					</div>
				</div>
			))}
		</>
	);
}
