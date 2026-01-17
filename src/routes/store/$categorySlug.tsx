import {
	createFileRoute,
	notFound,
	stripSearchParams,
} from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { StoreProductGrid } from "~/components/ui/store/StoreProductGrid";
import { categoryQueryOptions } from "~/lib/queryOptions";
import { seo } from "~/utils/seo";
import {
	defaultStoreSearchValues,
	storeSearchParamsSchema,
} from "~/utils/storePageUtils";

export const Route = createFileRoute("/store/$categorySlug")({
	component: CategoryStorePage,
	validateSearch: zodValidator(storeSearchParamsSchema),
	// Strip default values from URL to keep it clean
	search: {
		middlewares: [stripSearchParams(defaultStoreSearchValues)],
	},
	loader: async ({ params, context: { queryClient } }) => {
		// Fetch and cache category data (used for validation, SEO, and UI)
		try {
			const category = await queryClient.ensureQueryData(
				categoryQueryOptions(params.categorySlug),
			);

			// Check if category exists and is active
			if (!category || !category.isActive) {
				throw notFound();
			}

			return { category };
		} catch (error) {
			// Check if it's a notFound() error (can be symbol or object with isNotFound)
			if (
				error === notFound() ||
				(error &&
					typeof error === "object" &&
					"isNotFound" in error &&
					error.isNotFound)
			) {
				throw notFound();
			}

			// If it's an error from getCategoryBySlug (404), throw notFound
			if (error instanceof Error && error.message === "Category not found") {
				throw notFound();
			}

			// Log unexpected errors for debugging
			console.error("Unexpected error loading category:", error);

			// For any other error, throw notFound
			throw notFound();
		}
	},
	head: ({ loaderData }) => {
		const category = loaderData?.category;
		return {
			meta: [
				...seo({
					title: category
						? `${category.name} - Rublevsky Studio`
						: "Category - Rublevsky Studio",
					description: category
						? `Browse ${category.name} products. Premium quality products for tea enthusiasts and design lovers.`
						: "Browse products by category. Premium quality products for tea enthusiasts and design lovers.",
				}),
			],
		};
	},
});

function CategoryStorePage() {
	const { categorySlug } = Route.useParams();
	const loaderData = Route.useLoaderData();
	const category = loaderData?.category;
	const searchParams = Route.useSearch();
	const navigate = Route.useNavigate();

	return (
		<StoreProductGrid
			categorySlug={categorySlug}
			categoryName={category?.name ?? null}
			searchParams={searchParams}
			navigate={navigate}
		/>
	);
}
