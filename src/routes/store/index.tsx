import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import StoreFeed from "~/components/ui/store/StoreFeed";
import { storeDataQueryOptions } from "~/lib/queryOptions";
import { seo } from "~/utils/seo";

export const Route = createFileRoute("/store/")({
	component: StorePage,
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
	// Get store data directly from TanStack Query (with persist plugin)
	const { data: storeData } = useSuspenseQuery(storeDataQueryOptions());

	return (
		<main>
			<StoreFeed
				products={storeData.products}
				categories={storeData.categories}
				teaCategories={storeData.teaCategories}
			/>
		</main>
	);
}
