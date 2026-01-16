import type { ProductVariationWithAttributes } from "~/types";

const collator = new Intl.Collator("ru", {
	numeric: true,
	sensitivity: "base",
});

const normalize = (value: string) => value.trim().replace(",", ".");

export const sortVariationsForDisplay = (
	variations: ProductVariationWithAttributes[],
) => {
	if (variations.length <= 1) return variations;

	const attributeIds = Array.from(
		new Set(
			variations.flatMap((variation) =>
				variation.attributes.map((attr) => attr.attributeId),
			),
		),
	).sort((a, b) => collator.compare(a, b));

	const getValue = (
		variation: ProductVariationWithAttributes,
		attributeId: string,
	) =>
		normalize(
			variation.attributes.find((attr) => attr.attributeId === attributeId)
				?.value || "",
		);

	return [...variations].sort((a, b) => {
		for (const attributeId of attributeIds) {
			const comparison = collator.compare(
				getValue(a, attributeId),
				getValue(b, attributeId),
			);
			if (comparison !== 0) return comparison;
		}

		return 0;
	});
};
