import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import StoreFeed from "~/components/ui/store/StoreFeed";
import { storeDataQueryOptions } from "~/lib/queryOptions.ts";
import { seo } from "~/utils/seo";

// Simple search params validation for category filtering
const validateSearch = (search: Record<string, unknown>) => {
	const result: { category?: string } = {};

	if (typeof search.category === "string") {
		result.category = search.category;
	}

	return result;
};

export const Route = createFileRoute("/store/")({
	component: StorePage,
	validateSearch,
	// Strip undefined values from URL to keep it clean
	search: {
		middlewares: [stripSearchParams({})],
	},
	head: () => ({
		meta: [
			...seo({
				title: "Store - Rublevsky Studio",
				description:
					"Tea, handmade clothing prints, posters, and stickers. Premium quality products for tea enthusiasts and design lovers.",
			}),
		],
	}),
});

function StorePage() {
	const search = Route.useSearch();
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

	// Get store data directly from TanStack Query (with persist plugin)
	const { data: storeData } = useSuspenseQuery(storeDataQueryOptions());

	// Sync URL category parameter with local state
	useEffect(() => {
		setSelectedCategory(search.category || null);
	}, [search.category]);

	return (
		<main>
			<StoreFeed
				products={storeData.products}
				categories={storeData.categories}
				initialCategory={selectedCategory}
			/>
		</main>
	);
}
