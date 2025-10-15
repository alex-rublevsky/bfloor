import { createFileRoute } from "@tanstack/react-router";
import { Button } from "~/components/ui/shared/Button";
//import { usePrefetch } from "~/hooks/usePrefetch";
import "../styles/app.css";
import { seo } from "~/utils/seo";
import { Banner } from "~/components/ui/Banner";


export const Route = createFileRoute("/")({
	component: App,
	head: () => ({
		meta: [
			...seo({
				title: "BeautyFloor",
				description: "Web Development, Graphic Design, Tea Reviews",
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
						<Banner/>
						<h1 className="text-2xl!">
							BeautyFloor
						</h1>
						{/*<TestimonialsSection/>*/}
						<nav aria-label="Main navigation" className="space-y-3 mt-6">
							<Button
								to="/web"
								centered
								variant="secondary"
								className="w-full max-w-lg"
								description="I design and code web experiences — from blogs to ecommerce solutions"
							>
								Каталог
							</Button>
							
						</nav>
					</section>
				</div>
			</main>

		
		</div>
	);
}
