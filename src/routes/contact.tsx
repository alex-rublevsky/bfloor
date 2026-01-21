import { createFileRoute } from "@tanstack/react-router";
import { Link } from "~/components/ui/shared/Link";
import { storeLocationsQueryOptions } from "~/lib/queryOptions";
import { seo } from "~/utils/seo";

export const Route = createFileRoute("/contact")({
	component: ContactPage,
	// Loader ensures store locations are loaded before component renders
	// Uses ensureQueryData for caching (7 days staleTime, 14 days gcTime)
	// - If cached → returns instantly
	// - If stale → returns cached, refetches in background
	loader: async ({ context: { queryClient } }) => {
		const storeLocations = await queryClient.ensureQueryData(
			storeLocationsQueryOptions(),
		);
		return { storeLocations };
	},
	head: () => ({
		meta: [
			...seo({
				title: "Контакты - BeautyFloor",
				description: "Поможем подобрать напольные покрытия для вашего проекта",
			}),
		],
	}),
});

function ContactPage() {
	const { storeLocations } = Route.useLoaderData();

	return (
		<section>
			<h1 className="text-3xl font-bold mb-8">Контакты и Адреса</h1>

			<div className="flex flex-wrap gap-6">
				<div className="bg-card p-6 rounded-lg border w-fit">
					<div className="space-y-1">
						<Link
							href="tel:+79084466740"
							variant="large"
							className="text-muted-foreground hover:text-foreground block"
						>
							8 908 446 6740
						</Link>
						<Link
							href="tel:+79025559405"
							variant="large"
							className="text-muted-foreground hover:text-foreground block"
						>
							8 902 555 9405
						</Link>
						<Link
							href="tel:+79084486785"
							variant="large"
							className="text-muted-foreground hover:text-foreground block"
						>
							8 908 448 6785
						</Link>

						<Link
							href="mailto:info@beautyfloor.ru"
							variant="large"
							className="text-muted-foreground hover:text-foreground"
						>
							info@beautyfloor.ru
						</Link>
					</div>
				</div>

				{storeLocations.map((location) => (
					<div key={location.id} className="bg-card p-6 rounded-lg border">
						<div className="space-y-3">
							<div>
								<Link
									href={`https://yandex.ru/maps/?text=${encodeURIComponent(`Владивосток, ${location.address}`)}`}
									target="_blank"
									rel="noopener noreferrer"
									variant="large"
								>
									Владивосток, {location.address}
								</Link>
								{location.description && (
									<p className="text-sm text-muted-foreground mt-1">
										{location.description}
									</p>
								)}
							</div>
							<div>
								<h6>Часы работы:</h6>
								<div className="text-muted-foreground whitespace-pre-line">
									{location.openingHours}
								</div>
							</div>
						</div>
					</div>
				))}
			</div>
		</section>
	);
}
