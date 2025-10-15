import { createFileRoute } from "@tanstack/react-router";
import BrandingSection from "~/components/ui/studio/branding/BrandingSection";
import GallerySection from "~/components/ui/studio/gallery/GallerySection";

export const Route = createFileRoute("/design/")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<main>
			<BrandingSection />
			<GallerySection type="posters" />
		</main>
	);
}
