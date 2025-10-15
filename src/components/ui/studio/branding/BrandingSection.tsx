import { useId, useState } from "react";
import BrandingList from "./BrandingList";
import type { BrandingProject } from "./brandingTypes";
import Modal from "./Modal";

export default function BrandingSection() {
	const [selected, setSelected] = useState<BrandingProject | null>(null);
	const brandingId = useId();

	return (
		<section id={brandingId}>
			<h1 className="text-center work_page_section_title_holder">Branding</h1>
			<BrandingList setSelected={setSelected}></BrandingList>

			<Modal selected={selected} setSelected={setSelected}></Modal>
		</section>
	);
}
