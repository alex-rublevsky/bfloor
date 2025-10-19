import type { Category, CategoryTreeNode } from "~/types";

/**
 * Build a tree structure from flat category array
 */
export function buildCategoryTree(categories: Category[]): CategoryTreeNode[] {
	const categoryMap = new Map<string, CategoryTreeNode>();
	const rootCategories: CategoryTreeNode[] = [];

	// First pass: Create all nodes
	for (const category of categories) {
		categoryMap.set(category.slug, {
			...category,
			children: [],
			depth: 0,
		});
	}

	// Second pass: Build parent-child relationships and calculate depth
	for (const category of categories) {
		const node = categoryMap.get(category.slug);
		if (!node) continue;

		if (!category.parentSlug) {
			// Root level category
			rootCategories.push(node);
		} else {
			// Child category - add to parent's children
			const parent = categoryMap.get(category.parentSlug);
			if (parent) {
				node.depth = parent.depth + 1;
				parent.children.push(node);
			} else {
				// Parent not found - treat as root
				rootCategories.push(node);
			}
		}
	}

	// Sort children by order
	const sortByOrder = (nodes: CategoryTreeNode[]) => {
		nodes.sort((a, b) => a.order - b.order);
		for (const node of nodes) {
			if (node.children.length > 0) {
				sortByOrder(node.children);
			}
		}
	};

	sortByOrder(rootCategories);

	return rootCategories;
}

/**
 * Flatten tree structure back to array with updated order
 */
export function flattenCategoryTree(tree: CategoryTreeNode[]): Category[] {
	const result: Category[] = [];
	let order = 0;

	const traverse = (nodes: CategoryTreeNode[], parentSlug: string | null) => {
		for (const node of nodes) {
			result.push({
				...node,
				parentSlug,
				order: order++,
			});
			if (node.children.length > 0) {
				traverse(node.children, node.slug);
			}
		}
	};

	traverse(tree, null);
	return result;
}

/**
 * Get all descendant slugs of a category
 */
export function getDescendantSlugs(
	categorySlug: string,
	categories: Category[],
): string[] {
	const descendants: string[] = [];
	const children = categories.filter((c) => c.parentSlug === categorySlug);

	for (const child of children) {
		descendants.push(child.slug);
		descendants.push(...getDescendantSlugs(child.slug, categories));
	}

	return descendants;
}

/**
 * Check if moving a category would create a circular reference
 */
export function wouldCreateCircularRef(
	categorySlug: string,
	newParentSlug: string | null,
	categories: Category[],
): boolean {
	if (!newParentSlug) return false;
	if (categorySlug === newParentSlug) return true;

	const descendants = getDescendantSlugs(categorySlug, categories);
	return descendants.includes(newParentSlug);
}
