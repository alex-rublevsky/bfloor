import { createFileRoute } from "@tanstack/react-router";
//import { usePrefetch } from "~/hooks/usePrefetch";
import "../styles/app.css";
import { Banner } from "~/components/ui/Banner";
import { seo } from "~/utils/seo";

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
						<Banner />

						{/*<TestimonialsSection/>*/}
					</section>
				</div>
			</main>
		</div>
	);
}
