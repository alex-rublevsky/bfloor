import { useEffect, useRef } from "react";

/**
 * Simple slug generation hook
 */
export function useSlugGeneration(
	sourceValue: string,
	isAutoSlug: boolean,
	updateSlug: (slug: string) => void,
) {
	const updateSlugRef = useRef(updateSlug);
	updateSlugRef.current = updateSlug;

	useEffect(() => {
		if (isAutoSlug && sourceValue) {
			const slug = generateSlug(sourceValue);
			updateSlugRef.current(slug);
		}
	}, [sourceValue, isAutoSlug]);
}

/**
 * Utility function to generate a slug from any text
 */
export function generateSlug(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^\w\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.trim();
}

/**
 * Hook for checking if a slug is custom (doesn't match auto-generated)
 */
export function useIsCustomSlug(
	currentSlug: string,
	sourceValue: string,
): boolean {
	return currentSlug !== generateSlug(sourceValue) && currentSlug !== "";
}
