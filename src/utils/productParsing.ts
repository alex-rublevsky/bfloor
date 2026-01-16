type ParsedProductAttribute = { attributeId: string; value: string };

export type VariationAttribute = {
	attributeId: string;
	value: string;
};

/**
 * Parse variation attributes from JSON string
 * Standardized format: [{"attributeId": "5", "value": "Дерево"}]
 */
export const parseVariationAttributes = (
	variationAttributes: string | null | undefined,
): VariationAttribute[] => {
	if (!variationAttributes) return [];
	try {
		const parsed = JSON.parse(variationAttributes);
		if (Array.isArray(parsed)) return parsed;
	} catch {
		return [];
	}
	return [];
};

export const parseImages = (
	images: string | string[] | null | undefined,
): string[] => {
	if (!images) return [];
	if (Array.isArray(images)) return images;
	if (typeof images === "string") {
		try {
			const parsed = JSON.parse(images);
			if (Array.isArray(parsed)) return parsed;
		} catch {
			// If JSON parsing fails, return empty array (legacy comma-separated format should be migrated)
			return [];
		}
	}
	return [];
};

export const parseProductAttributes = (
	productAttributes: unknown,
): ParsedProductAttribute[] => {
	if (!productAttributes) return [];
	if (Array.isArray(productAttributes)) return productAttributes;
	if (typeof productAttributes === "string") {
		try {
			const parsed = JSON.parse(productAttributes);
			if (Array.isArray(parsed)) return parsed;
		} catch {
			return [];
		}
	}
	return [];
};
