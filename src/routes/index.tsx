import { createFileRoute } from "@tanstack/react-router";
//import { usePrefetch } from "~/hooks/usePrefetch";
import "../styles/app.css";
import { Banner } from "~/components/ui/Banner";
import AboutSection from "~/components/ui/home/AboutSection";
import BenefitsSection from "~/components/ui/home/BenefitsSection";
import OurPartnersSection from "~/components/ui/home/OurPartnersSection";
import TestimonialSliderSection from "~/components/ui/home/testimonial/TestimonialSection";
import ProductSlider from "~/components/ui/shared/ProductSlider";
import { seo } from "~/utils/seo";

export const Route = createFileRoute("/")({
	component: App,
	head: () => ({
		meta: [
			...seo({
				title: "BeautyFloor",
				description: "Напольные покрытия во Владивостоке",
			}),
		],
	}),
});

function App() {
	//const { prefetchBlog, prefetchStore } = usePrefetch();

	return (
		<div className="min-h-screen flex flex-col">
			<main className="flex-1 flex items-center justify-center px-4 py-8">
				<div className="w-full max-w-md space-y-6 text-center">
					<section className="!p-0 !static">
						<Banner />
						<BenefitsSection />
						<ProductSlider />
						<OurPartnersSection />
						<AboutSection />
						<TestimonialSliderSection />
					</section>
				</div>
			</main>
		</div>
	);
}
