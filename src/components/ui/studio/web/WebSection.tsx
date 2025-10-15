"use client";

import { useId } from "react";
import { webProjects } from "~/data/webProjects";
import WebProjectCard from "./WebEntry";

export default function WebProjectsSection() {
	const id = useId();

	return (
		<section id={id} className="w-full">
			<div>
				<h1
					className="text-center work_page_section_title_holder"
					data-heading-reveal
				>
					Web
				</h1>

				{webProjects.map((project) => (
					<WebProjectCard key={project.id} project={project} />
				))}
			</div>
		</section>
	);
}
