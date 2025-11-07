import { createFileRoute } from "@tanstack/react-router";
//import { usePrefetch } from "~/hooks/usePrefetch";
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
		<>
			<Banner />
			<BenefitsSection />
			<ProductSlider mode="tabs" title="Товары по категориям" />
			<ProductSlider mode="simple" title="Скидки" />
			<OurPartnersSection />
			<TestimonialSliderSection />
			<AboutSection />
		</>
	);
}
