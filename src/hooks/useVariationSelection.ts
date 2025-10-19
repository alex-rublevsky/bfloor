import { useNavigate } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import {
	getAttributeNameFromSlug,
	getAttributeSlug,
} from "~/hooks/useProductAttributes";
import type {
	CartItem,
	ProductAttribute,
	ProductVariation,
	ProductWithVariations,
	VariationAttribute,
} from "~/types";
import { getAvailableQuantityForVariation } from "~/utils/validateStock";

interface UseVariationSelectionProps {
	product: ProductWithVariations | null;
	cartItems: CartItem[];
	search?: Record<string, string | undefined>; // If provided, uses URL state
	onVariationChange?: () => void;
	attributes?: ProductAttribute[]; // Database attributes for slug conversion
}

interface UseVariationSelectionReturn {
	selectedVariation: ProductVariation | null;
	selectedAttributes: Record<string, string>;
	selectVariation: (attributeId: string, value: string) => void;
	isAttributeValueAvailable: (attributeId: string, value: string) => boolean;
	clearVariation?: (attributeId: string) => void;
	clearAllVariations?: () => void;
}

export function useVariationSelection({
	product,
	cartItems,
	search,
	onVariationChange,
	attributes = [],
}: UseVariationSelectionProps): UseVariationSelectionReturn {
	const navigate = useNavigate();
	const useUrlState = search !== undefined;

	// Local state for product cards
	const [localSelectedAttributes, setLocalSelectedAttributes] = useState<
		Record<string, string>
	>({});

	// Convert URL search params to attributes (for product page)
	const urlSelectedAttributes = useMemo(() => {
		if (!useUrlState || !search) return {};

		const attributesMap: Record<string, string> = {};
		Object.entries(search).forEach(([paramName, value]) => {
			if (!value) return;

			// Convert slug back to attribute name
			const attributeName = getAttributeNameFromSlug(paramName, attributes);

			if (
				attributeName &&
				product?.variations?.some((variation) =>
					variation.attributes.some(
						(attr: VariationAttribute) => attr.attributeId === attributeName,
					),
				)
			) {
				attributesMap[attributeName] = value;
			}
		});

		return attributesMap;
	}, [useUrlState, search, product?.variations, attributes]);

	// Get current selected attributes based on mode
	const selectedAttributes = useUrlState
		? urlSelectedAttributes
		: localSelectedAttributes;

	// Auto-select first available variation for product cards
	useMemo(() => {
		if (useUrlState || !product?.hasVariations || !product.variations?.length)
			return;
		if (Object.keys(localSelectedAttributes).length > 0) return;

		const sortedVariations = [...product.variations].sort((a, b) => {
			if (product.unlimitedStock) return (b.sort ?? 0) - (a.sort ?? 0);

			const aStock = getAvailableQuantityForVariation(product, a.id, cartItems);
			const bStock = getAvailableQuantityForVariation(product, b.id, cartItems);

			if (aStock > 0 && bStock === 0) return -1;
			if (bStock > 0 && aStock === 0) return 1;
			return (b.sort ?? 0) - (a.sort ?? 0);
		});

		const firstVariation = sortedVariations[0];
		if (firstVariation?.attributes?.length > 0) {
			const autoAttributes: Record<string, string> = {};
			firstVariation.attributes.forEach((attr: VariationAttribute) => {
				autoAttributes[attr.attributeId] = attr.value;
			});
			setLocalSelectedAttributes(autoAttributes);
		}
	}, [useUrlState, product, cartItems, localSelectedAttributes]);

	// Get all unique attribute IDs
	const allAttributeIds = useMemo(() => {
		if (!product?.variations) return new Set<string>();

		const attributeIds = new Set<string>();
		product.variations.forEach((variation) => {
			variation.attributes.forEach((attr: VariationAttribute) => {
				attributeIds.add(attr.attributeId);
			});
		});
		return attributeIds;
	}, [product?.variations]);

	// Find selected variation
	const selectedVariation = useMemo(() => {
		if (
			!product?.variations ||
			!product.hasVariations ||
			Object.keys(selectedAttributes).length === 0
		) {
			return null;
		}

		const hasAllRequiredAttributes = Array.from(allAttributeIds).every(
			(attrId) => selectedAttributes[attrId],
		);

		if (!hasAllRequiredAttributes) return null;

		return (
			product.variations.find((variation) => {
				return Object.entries(selectedAttributes).every(([attrId, value]) =>
					variation.attributes.some(
						(attr: VariationAttribute) =>
							attr.attributeId === attrId && attr.value === value,
					),
				);
			}) || null
		);
	}, [product, selectedAttributes, allAttributeIds]);

	// Check if attribute value is available
	const isAttributeValueAvailable = useCallback(
		(attributeId: string, value: string): boolean => {
			if (!product?.variations) return false;

			const variationsWithValue = product.variations.filter((variation) =>
				variation.attributes.some(
					(attr: VariationAttribute) =>
						attr.attributeId === attributeId && attr.value === value,
				),
			);

			return variationsWithValue.some((variation) => {
				const testAttributes = { ...selectedAttributes, [attributeId]: value };

				const matches = Object.entries(testAttributes).every(([attrId, val]) =>
					variation.attributes.some(
						(attr: VariationAttribute) =>
							attr.attributeId === attrId && attr.value === val,
					),
				);

				if (!matches) return false;

				const availableQuantity = getAvailableQuantityForVariation(
					product,
					variation.id,
					cartItems,
				);
				return product.unlimitedStock || availableQuantity > 0;
			});
		},
		[product, selectedAttributes, cartItems],
	);

	// Select variation - handles both URL and local state
	const selectVariation = useCallback(
		(attributeId: string, value: string) => {
			if (!product?.variations) return;

			// Find best matching variation
			const desiredAttributes = { ...selectedAttributes, [attributeId]: value };

			let targetVariation = product.variations.find((variation) => {
				return Object.entries(desiredAttributes).every(([attrId, val]) =>
					variation.attributes.some(
						(attr: VariationAttribute) =>
							attr.attributeId === attrId && attr.value === val,
					),
				);
			});

			if (!targetVariation) {
				const candidateVariations = product.variations.filter((variation) =>
					variation.attributes.some(
						(attr: VariationAttribute) =>
							attr.attributeId === attributeId && attr.value === value,
					),
				);

				candidateVariations.sort((a, b) => {
					const aMatches = Object.entries(selectedAttributes).filter(
						([attrId, val]) =>
							attrId !== attributeId &&
							a.attributes.some(
								(attr: VariationAttribute) =>
									attr.attributeId === attrId && attr.value === val,
							),
					).length;
					const bMatches = Object.entries(selectedAttributes).filter(
						([attrId, val]) =>
							attrId !== attributeId &&
							b.attributes.some(
								(attr: VariationAttribute) =>
									attr.attributeId === attrId && attr.value === val,
							),
					).length;
					return bMatches - aMatches;
				});

				targetVariation = candidateVariations[0];
			}

			if (targetVariation) {
				const newAttributes: Record<string, string> = {};
				targetVariation.attributes.forEach((attr: VariationAttribute) => {
					newAttributes[attr.attributeId] = attr.value;
				});

				if (useUrlState) {
					// Update URL state - use slugs for URL parameters
					const urlParams: Record<string, string | undefined> = {};

					targetVariation.attributes.forEach((attr: VariationAttribute) => {
						const slug = getAttributeSlug(attr.attributeId, attributes);
						urlParams[slug] = attr.value;
					});

					navigate({
						search: urlParams as unknown as Parameters<
							typeof navigate
						>[0]["search"],
						replace: true,
					});
				} else {
					// Update local state
					setLocalSelectedAttributes(newAttributes);
				}
			}

			onVariationChange?.();
		},
		[
			product?.variations,
			selectedAttributes,
			useUrlState,
			navigate,
			onVariationChange,
			attributes,
		],
	);

	// Clear functions (only for URL state)
	const clearVariation = useCallback(
		(attributeId: string) => {
			if (!useUrlState) return;

			const slug = getAttributeSlug(attributeId, attributes);
			const newSearch = { ...search };
			delete newSearch[slug];

			navigate({
				search: newSearch as unknown as Parameters<
					typeof navigate
				>[0]["search"],
				replace: true,
			});
			onVariationChange?.();
		},
		[useUrlState, search, navigate, onVariationChange, attributes],
	);

	const clearAllVariations = useCallback(() => {
		if (!useUrlState) return;

		// Clear all attribute parameters from URL
		const newSearch = { ...search };
		attributes.forEach((attr) => {
			delete newSearch[attr.slug];
		});

		navigate({
			search: newSearch as unknown as Parameters<typeof navigate>[0]["search"],
			replace: true,
		});
		onVariationChange?.();
	}, [useUrlState, navigate, onVariationChange, search, attributes]);

	return {
		selectedVariation,
		selectedAttributes,
		selectVariation,
		isAttributeValueAvailable,
		clearVariation,
		clearAllVariations,
	};
}
