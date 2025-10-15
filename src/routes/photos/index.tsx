import { createFileRoute } from "@tanstack/react-router";
import GallerySection from "~/components/ui/studio/gallery/GallerySection";
import { seo } from "~/utils/seo";

export const Route = createFileRoute("/photos/")({
	component: RouteComponent,
	head: () => ({
		meta: [
			...seo({
				title: "Photography - Rublevsky Studio",
				description:
					"Some portraits and animal pics",
			}),
		],
	}),
});

function RouteComponent() {
	return (
		<main>
			<GallerySection type="photos" />
		</main>
	);
}
