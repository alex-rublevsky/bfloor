import { AnimatedGroup } from "~/components/motion_primitives/AnimatedGroup";
import { TextEffect } from "~/components/motion_primitives/AnimatedText";
import NeumorphismCard from "~/components/ui/shared/NeumorphismCard";

const data = [
	{
		title: "Flexible and scalable",
		description: "Scale up or down as needed, and pause or cancel at anytime",
	},
	{
		title: "Design board",
		description: "Easily manage your design queue with a Trello board.",
	},
	{
		title: "Fast delivery",
		description:
			"Get your design one at a time in just a couple days on average.",
	},
	{
		title: "Fixed monthly rate",
		description: "No surprises here! Pay the same fixed price each month.",
	},
	{
		title: "Top-notch quality",
		description:
			"Senior-level design quality at your fingertips, whenever you need it.",
	},
];

function MembershipBenefitsSection() {
	return (
		<section className="mx-auto">
			<AnimatedGroup>
				<TextEffect as="h2" className="mb-12">
					Membership Benefits
				</TextEffect>
				<AnimatedGroup className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-8">
					{data.map((item) => (
						<NeumorphismCard key={item.title} className="w-full">
							<h3 className="mb-2">{item.title}</h3>
							<p className="text-muted-foreground">{item.description}</p>
						</NeumorphismCard>
					))}
				</AnimatedGroup>
			</AnimatedGroup>
		</section>
	);
}
export default MembershipBenefitsSection;
