import { createFileRoute } from "@tanstack/react-router";
import ExperienceTimelineSection from "~/components/ui/studio/ExperienceTimelineSection";
import { SkillsSection } from "~/components/ui/studio/SkillsSection";
import WebProjectsSection from "~/components/ui/studio/web/WebSection";
import { seo } from "~/utils/seo";

export const Route = createFileRoute("/web/")({
	component: RouteComponent,
	head: () => ({
		meta: [
			...seo({
				title: "Web Development - Rublevsky Studio",
				description:
					"Website design and development projects",
			}),
		],
	}),
});

function RouteComponent() {
	return (
		<main>
			<WebProjectsSection />
			<SkillsSection />
			<ExperienceTimelineSection />
		</main>
	);
}
