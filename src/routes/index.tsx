// import HeroSection from "~/components/ui/studio/HeroSection";
// import MembershipBenefitsSection from "~/components/ui/studio/MembershipBenefitsSection";
// import SubscriptionSection from "~/components/ui/studio/SubscriptionSection";

// import TestimonialsSection from "~/components/ui/studio/testimonial/TestimonialSection";
// import FaqSection from "~/components/ui/studio/FaqSection";
// import ServicesOffered from "~/components/ui/studio/ServicesSection";
// import { SkillsSection } from "~/components/ui/studio/SkillsSection";
// import ExperienceTimelineSection from "~/components/ui/studio/ExperienceTimelineSection";
// import WebProjectsSection from "~/components/ui/studio/web/WebSection";
// import BrandingSection from "~/components/ui/studio/branding/BrandingSection";
// import GallerySection from "~/components/ui/studio/gallery/GallerySection";
// import CallBookingSection from "~/components/ui/studio/CallBookingSection";
// import SmoothScroll from "~/components/SmoothScroll";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "~/components/ui/shared/Button";
import { usePrefetch } from "~/hooks/usePrefetch";
import "../styles/app.css";
import { seo } from "~/utils/seo";

export const Route = createFileRoute("/")({
	component: App,
	head: () => ({
		meta: [
			...seo({
				title: "Rublevsky Studio",
				description: "Web Development, Graphic Design, Tea Reviews",
			}),
		],
	}),
});

function App() {
	const { prefetchBlog, prefetchStore } = usePrefetch();

	return (
		<div className="min-h-screen flex flex-col">
			<main className="flex-1 flex items-center justify-center px-4 py-8">
				<div className="w-full max-w-md space-y-6 text-center">
					<section className="!p-0 !static">
						<h1 className="text-2xl!">
							Hi, I'm Alex. I do things. Mostly code, design and tea reviews.
						</h1>
						<nav aria-label="Main navigation" className="space-y-3 mt-6">
							<Button
								to="/web"
								centered
								variant="secondary"
								className="w-full max-w-lg"
								description="I design and code web experiences — from blogs to ecommerce solutions"
							>
								Websites
							</Button>
							<Button
								to="/design"
								centered
								variant="secondary"
								className="w-full max-w-lg"
								description="Includes branding, packaging, posters, photomanipulations,"
							>
								Graphic Design
							</Button>
							<Button
								to="/blog"
								centered
								variant="secondary"
								className="w-full max-w-lg"
								description="I study, drink, compare and analyse traditional chinese tea, as well as conduct tea ceremonies"
								onMouseEnter={prefetchBlog}
							>
								Tea Blog
							</Button>
							<Button
								to="/store"
								centered
								variant="secondary"
								className="w-full max-w-lg"
								description="I sell tea, handmade clothing prints, posters and stickers"
								onMouseEnter={prefetchStore}
							>
								Store
							</Button>
							<Button
								to="/photos"
								centered
								variant="secondary"
								className="w-full max-w-lg"
								description="Some portraits and animal pics "
							>
								Photography
							</Button>
						</nav>
					</section>
				</div>
			</main>

			<footer className="flex flex-col items-center justify-center">
				<p className="text-center">Let's level up your business together!</p>
				<div className="flex flex-wrap gap-2 justify-center pb-4 pt-2 border-t border-gray-200/20">
					<Button
						href="https://assets.rublevsky.studio/PDF/Resume%20Alexander%20Rublevsky.pdf"
						target="_blank"
						variant="secondary"
					>
						Resume
					</Button>
					<Button
						href="https://t.me/alexrublevsky"
						target="_blank"
						variant="secondary"
					>
						Telegram
					</Button>
					<Button href="mailto:alexander@rublevsky.studio" variant="secondary">
						Email
					</Button>
				</div>
			</footer>
		</div>

		// TODO: things that are no longer used:

		//     <HeroSection />
		//     <MembershipBenefitsSection />
		//     <SubscriptionSection />
		//     <TestimonialsSection />
		//     <FaqSection />
		//     <ServicesOffered />
		//     <CallBookingSection />

		// </SmoothScroll>
	);
}
