import { AnimatedGroup } from "~/components/motion_primitives/AnimatedGroup";
import { TextEffect } from "~/components/motion_primitives/AnimatedText";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "~/components/ui/studio/Accordion";

const data = [
	// {
	//   question: "How fast will I receive my designs?",
	//   answer:
	//     "On average, most requests are completed in just two days or less. However, more complex requests can take longer.",
	// },
	{
		question: "How does onboarding work?",
		answer:
			"Subscribe to a plan and we'll quickly add you to your very own Trello board. This process usually takes about an hour to complete from the time you subscribe. Once you accept the invite to Trello, you're ready to rock. \nFurther instructions on how to use the Trello board to request designs can be found on the board itself.",
	},
	// {
	//   question: "Who are the designers?",
	//   answer:
	//     "Rublevsky studio is a one-man agency, ran by Alexander, the founder. Rublevsky studio does not employ other designers, or outsource work to any other entity. You'll work directly with me through the entirety of your experience.",
	// },
	{
		question: "Is there a limit to how many requests I can make?",
		answer:
			"Once subscribed, you're able to add as many design requests to your queue as you'd like, and they will be delivered one by one.",
	},
	{
		question: "How does the pause feature work?",
		answer:
			"We understand you may not have enough design work to fill up entire month. Perhaps you only have one or two design requests at the moment. That's where pausing your subscription comes in handy. \nBilling cycles are based on 31 day period. Let's say you sign up and use the service for 21 days, and then decide to pause your subscription. This means that the billing cycle will be paused and you'll have 10 days of service remaining to be used anytime in the future.",
	},
	{
		question: "How do you handle larger requests?",
		answer:
			"Larger requests are broken down on Rublevsky Studio's end. This applies to full-scale website or mobile app designs, UI/UX work, etc. You should expect to receive a reasonable amount of work every 24-48 hours until the entire request is done.",
	},
	{
		question: "What programs do you design in?",
		answer: "Most requests are designed using Photoshop and Figma.",
	},
	// {
	//   question: "How does Webflow development work?",
	//   answer:
	//     "Webflow development is included with all subscriptions and is simply treated as a design request. As long as your website can be supported by the Webflow platform, Rublevsky Studio will take care of the development to ensure maximum fidelity when it comes to the final product. \nOnce the website is fully developed, the site will be transferred to your account, where you will own it from that point forward. Therefore, a Rublevsky Studio subscription is not necessary to maintain your website.",
	// },
	{
		question: "How will I request designs?",
		answer:
			"Rublevsky Studio offers a ton of flexibility in how you request designs using Trello. Some common ways clients request designs is directly via Trello, sharing Google docs or wireframes, or even recording a brief Loom video (for those who prefer not to write their briefs out). Basically, if it can be linked to or shared in Trello, it's fair game.",
	},
	{
		question: "What if I don't like the design?",
		answer:
			"No worries! We'll continue to revise the design until you're 100% satisfied.",
	},
	{
		question: "Are there any requests you don't support?",
		answer:
			"Absolutely. Rublevsky Studio does not cover the following design work: complex 3D modeling, animated graphics (GIFS, etc.), document design (medical forms, etc.), complex packaging, and extensive print design (magazines, books, etc.).",
	},
	{
		question: "What if I only have a single request?",
		answer:
			"That's fine. You can pause your subscription when finished and return when you have additional design needs. There's no need to let the remainder of your subscription go to waste.",
	},
	{
		question: "Are there any refunds?",
		answer:
			"Due to the high quality nature of the work, there will be no refunds issued past the first week of service. However, no refunds will be issued for completed work.",
	},
	{
		question: "Can I use Rublevsky Studio for just a month?",
		answer:
			"For sure. Whether you need Rublevsky Studio for a month or a year, the choice is yours. Just feel free to come back when you have additional design needs.",
	},
];

function FaqSection() {
	return (
		<section className="no-padding">
			<AnimatedGroup>
				<TextEffect as="h2" className="mb-12 ml-4 sm:ml-6">
					FAQ
				</TextEffect>
				<div className="grid grid-cols-1 lg:grid-cols-1 gap-16 md:gap-8">
					<Accordion type="single" collapsible className="w-full">
						{data.map((item, index) => (
							<AccordionItem
								key={`item-${index + 1}`}
								value={`item-${index + 1}`}
							>
								<AccordionTrigger className="hover:no-underline text-left">
									<h4 className="md:!text-2xl ml-4 sm:ml-6">{item.question}</h4>
								</AccordionTrigger>
								<AccordionContent>
									{item.answer.split("\n").map((paragraph, i) => (
										<p
											key={`${item.question}-paragraph-${i}`}
											className="mb-4 last:mb-0 ml-4 sm:ml-6"
										>
											{paragraph}
										</p>
									))}
								</AccordionContent>
							</AccordionItem>
						))}
					</Accordion>
					{/* <NeumorphismCard className="col-span-1 sticky top-10  size-fit lg:mx-auto flex flex-col gap-4">
            <div
              className={
                "relative w-24 h-24 inset-0 overflow-hidden rounded-full transition-all duration-500"
              }
            >
              <Image
                src="/me.jpg"
                alt="Profile picture"
                className={
                  "w-[200%] h-[200%] object-cover object-top transition-all duration-500"
                }
                width={192}
                height={192}
              />
            </div>
            <h3>Book a 15-min intro call</h3>
            <Button asChild>
              <RouterLink to="/" hash="#booking" id="booking">
                Book a call
              </RouterLink>
            </Button>

            <div className="flex gap-6">
              <h5>
                <Link href="mailto:alexander.rublevskii@gmail.com">Email</Link>
              </h5>
              <h5>
                <Link href="https://t.me/alexrublevsky" target="_blank">
                  Telegram
                </Link>
              </h5>
            </div>
          </NeumorphismCard> */}
				</div>
			</AnimatedGroup>
		</section>
	);
}

export default FaqSection;
