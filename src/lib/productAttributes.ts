export interface ProductAttribute {
	id: string;
	displayName: string;
}

export const PRODUCT_ATTRIBUTES: { [key: string]: ProductAttribute } = {
	SIZE_CM: {
		id: "SIZE_CM",
		displayName: "Size cm",
	},
	SIZE: {
		id: "SIZE",
		displayName: "Size",
	},
	COLOR: {
		id: "COLOR",
		displayName: "Color",
	},
	APPAREL_TYPE: {
		id: "APPAREL_TYPE",
		displayName: "Apparel Type",
	},
	WEIGHT_G: {
		id: "WEIGHT_G",
		displayName: "Weight g",
	},
};

/**
 * Helper function to get the display name for an attribute ID
 * This is a client-side function that can be used anywhere in the application
 */
export function getAttributeDisplayName(attributeId: string): string {
	const attribute = PRODUCT_ATTRIBUTES[attributeId];
	return attribute ? attribute.displayName : attributeId;
}
