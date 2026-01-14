import { useNavigate } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import type {
	ProductAttribute,
	ProductVariation,
	ProductWithVariations,
	VariationAttribute,
} from "~/types";

interface UseVariationSelectionProps {
	product: ProductWithVariations | null;
	search?: Record<string, string | undefined>; // If provided, uses URL state
	onVariationChange?: () => void;
	attributes?: ProductAttribute[]; // Database attributes for slug conversion
}

interface UseVariationSelectionReturn {
	selectedVariation: ProductVariation | null;
	selectedAttributes: Record<string, string>;
	selectVariation: (attributeId: string, value: string) => void;
}

export function useVariationSelection({
	product,
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

			// Find the attribute by slug in the database attributes
			const dbAttribute = attributes.find((attr) => attr.slug === paramName);

			if (dbAttribute) {
				// Use the numeric ID as string (e.g., "20") to match variation.attributes
				const attributeId = dbAttribute.id.toString();

				// Check if any variation has this attribute
				if (
					product?.variations?.some((variation) =>
						variation.attributes.some(
							(attr: VariationAttribute) => attr.attributeId === attributeId,
						),
					)
				) {
					attributesMap[attributeId] = value;
				}
			}
		});

		return attributesMap;
	}, [useUrlState, search, product?.variations, attributes]);

	// Get current selected attributes based on mode
	const selectedAttributes = useUrlState
		? urlSelectedAttributes
		: localSelectedAttributes;

	// Auto-select first available variation for product cards (local state mode)
	useMemo(() => {
		if (useUrlState || !product?.hasVariations || !product.variations?.length)
			return;
		if (Object.keys(localSelectedAttributes).length > 0) return;

		const sortedVariations = [...product.variations].sort((a, b) => {
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
	}, [useUrlState, product, localSelectedAttributes]);

	// Auto-select first variation for product page (URL state mode) if no selection yet
	useMemo(() => {
		if (!useUrlState || !product?.hasVariations || !product.variations?.length)
			return;
		if (Object.keys(urlSelectedAttributes).length > 0) return;

		// Only auto-select if there's exactly one variation
		if (product.variations.length === 1) {
			const firstVariation = product.variations[0];
			if (firstVariation?.attributes?.length > 0) {
				const urlParams: Record<string, string> = {};
				firstVariation.attributes.forEach((attr: VariationAttribute) => {
					const dbAttribute = attributes.find(
						(a) => a.id.toString() === attr.attributeId,
					);
					const slug = dbAttribute?.slug || attr.attributeId;
					urlParams[slug] = attr.value;
				});

				// Update URL with the auto-selected variation
				navigate({
					search: urlParams as unknown as Parameters<
						typeof navigate
					>[0]["search"],
					replace: true,
				});
			}
		}
	}, [useUrlState, product, urlSelectedAttributes, attributes, navigate]);

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

	// Select variation - handles both URL and local state
	const selectVariation = useCallback(
		(attributeId: string, value: string) => {
			if (!product?.variations) return;

			// Find matching variation
			const desiredAttributes = { ...selectedAttributes, [attributeId]: value };

			const targetVariation = product.variations.find((variation) => {
				return Object.entries(desiredAttributes).every(([attrId, val]) =>
					variation.attributes.some(
						(attr: VariationAttribute) =>
							attr.attributeId === attrId && attr.value === val,
					),
				);
			});

			if (!targetVariation) {
				// No exact match found, do nothing
				return;
			}

			// Update state with the selected variation
			{
				const newAttributes: Record<string, string> = {};
				targetVariation.attributes.forEach((attr: VariationAttribute) => {
					newAttributes[attr.attributeId] = attr.value;
				});

				if (useUrlState) {
					// Update URL state - use slugs for URL parameters
					const urlParams: Record<string, string | undefined> = {};

					targetVariation.attributes.forEach((attr: VariationAttribute) => {
						// attr.attributeId is a numeric ID string (e.g., "20")
						// Find the corresponding attribute to get its slug
						const dbAttribute = attributes.find(
							(a) => a.id.toString() === attr.attributeId,
						);
						const slug = dbAttribute?.slug || attr.attributeId;
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

	return {
		selectedVariation,
		selectedAttributes,
		selectVariation,
	};
}
