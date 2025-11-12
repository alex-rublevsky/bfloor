// Filter layout configuration
// Attributes that should use "wrap" layout (all options visible, natural wrapping)
// vs "row-based" layout (fixed rows with horizontal scrolling)

/**
 * Attribute slugs that should use "wrap" layout on mobile (and optionally desktop).
 * These filters have a normal amount of options and should be fully visible.
 */
export const WRAP_LAYOUT_ATTRIBUTE_SLUGS = [
	"design",
	"height-mm",
	"finish",
	"bevel",
	"thickness-mm",
	"sistema-montazha",
	"warm-floor-compatible",
	"podlozhka",
	"material",
	"fire-safety-class",
	"wear-resistance-class",
] as const;

/**
 * Check if an attribute should use wrap layout based on its slug
 */
export function shouldUseWrapLayout(attributeSlug: string): boolean {
	return WRAP_LAYOUT_ATTRIBUTE_SLUGS.includes(
		attributeSlug as (typeof WRAP_LAYOUT_ATTRIBUTE_SLUGS)[number],
	);
}
