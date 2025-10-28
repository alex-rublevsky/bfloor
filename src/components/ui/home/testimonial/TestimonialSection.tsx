import useEmblaCarousel from "embla-carousel-react";
import "./testimonial.css";
import { AnimatedGroup } from "~/components/motion_primitives/AnimatedGroup";
import { Image } from "~/components/ui/shared/Image";
import NeumorphismCard from "~/components/ui/shared/NeumorphismCard";
import {
	NextButton,
	PrevButton,
	usePrevNextButtons,
} from "./TestimonialArrows";
import { DotButton, useDotButton } from "./TestimonialDotButton";

const testimonials = [
	{
		id: 1,
		name: "Степанова Алёна",
		rating: 5,
		date: "2019-08-18",
		content:"В поисках качественного напольного покрытия обратилась в магазин Beauty Floor — требовался красивый, крепкий, нешумный и теплый пол для квартиры в новостройке. Приходила в салон несколько раз — смотрела, выбирала, советовалась. Выбрала пробковый пол Egger с подходящим соотношением цены и качества. Спасибо сотрудникам салона — дали поцарапать ногтем, походить, попрыгать и вообще всячески повоздействовать на образцы)) Идеальное знание своего продукта, очень вежливое и приветливое отношение к клиентам — это редко и очень приятно) Доставка покрытия со склада в другом городе в течение трех недель, а дальнейшее хранение на складе во Владивостоке бесплатно, не нужно думать над тем, куда все эти коробки сложить, чтобы не испортить пол. В салоне огромное количество различных настенных и напольных покрытий и аксессуаров к ним — порогов, плинтусов, подложек. Я очень благодарна ребятам из Beauty Floor за помощь в подборе паркета, за дружеское отношение и отличный сервис!)"
		,avatar: "/testimonials/roman.webp",
		link: "https://www.google.ru/maps/place/Beauty+Floor/@43.1688399,131.9257411,17z/data=!4m18!1m9!3m8!1s0x5fb39183a2c24f9f:0x50ad4f6d76b05a03!2sBeauty+Floor!8m2!3d43.168836!4d131.928316!9m1!1b1!16s%2Fg%2F11rqx6015!3m7!1s0x5fb39183a2c24f9f:0x50ad4f6d76b05a03!8m2!3d43.168836!4d131.928316!9m1!1b1!16s%2Fg%2F11rqx6015?entry=ttu",
	},
	{
		id: 2,
		name: "Diana Egorova",
		role: "CEO at InkSoul",
		content:
			"In our interaction I liked Alexander's attentiveness to my requests, detailed analysis of my activity and his desire to find unusual and yet functional design solutions, suitable for the specifics of my work.",
		avatar: "/testimonials/diana.webp",
		link: "https://www.instagram.com/diana_inksoul/",
	},
	{
		id: 3,
		name: "Kristina",
		role: "Street Artist",
		content:
			"I reached out to Alexander to help expand my personal brand, and he assisted with creating merchandise, including clothing, stickers, and posters. I really appreciated his creativity and straightforward approach to the task.",
		avatar: "/testimonials/kristina.jpg",
		link: "https://www.instagram.com/abalych",
	},
	{
		id: 4,
		name: "Brighton",
		role: "Music Artist",
		content:
			"Alexander did an outstanding job with pre-press editing and large-format printing of posters that brilliantly showcase my artistic vision. His attention to detail and expertise brought my ideas to life, delivering mind-blowing quality that was absolutely top-notch. Everything was fabulous—from the prints themselves to the entire experience—which has helped elevate my brand presence and supported my music journey immensely.",
		avatar: "/testimonials/brighton.webp",
		link: "https://on.soundcloud.com/yBk5X3a4cWA4xnWdA",
	},
];

export default function TestimonialSliderSection() {
	const [emblaRef, emblaApi] = useEmblaCarousel({
		loop: true,
	});

	const {
		prevBtnDisabled,
		nextBtnDisabled,
		onPrevButtonClick,
		onNextButtonClick,
	} = usePrevNextButtons(emblaApi);

	const { selectedIndex, scrollSnaps, onDotButtonClick } =
		useDotButton(emblaApi);

	return (
		<section className="embla no-padding">
			{/* Arrow controls positioned above carousel on the right */}
			<div className="embla__controls">
				<div className="embla__buttons">
					<PrevButton onClick={onPrevButtonClick} disabled={prevBtnDisabled} />
					<NextButton onClick={onNextButtonClick} disabled={nextBtnDisabled} />
				</div>
			</div>
			
			<div className="embla__viewport" ref={emblaRef}>
				<div className="embla__container">
					{testimonials.map((testimonial, index) => (
						<AnimatedGroup
							amount={0.5}
							delay={index * 0.1}
							className="embla__slide"
							key={testimonial.id}
						>
							<NeumorphismCard className="m-10">
								<div className="testimonial-card">
									<p className="mb-6">&ldquo;{testimonial.content}&rdquo;</p>
									<a
										href={testimonial.link}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center group transition-transform duration-300 ease-in-out transform hover:translate-y-[-5px]"
									>
										<div className="w-12 h-12 rounded-full mr-4 relative overflow-hidden">
											<Image
												src={testimonial.avatar}
												alt={testimonial.name}
												//fill
												className="object-cover"
												loading="eager"
											/>
										</div>
										<div>
											<p className="font-semibold group-hover:underline">
												{testimonial.name}
											</p>
											<p className="text-sm text-muted-foreground">
												{testimonial.role}
											</p>
										</div>
									</a>
								</div>
							</NeumorphismCard>
						</AnimatedGroup>
					))}
				</div>
			</div>
			
			{/* Dot indicators positioned below the carousel */}
			<div className="embla__dots-container">
				<div className="embla__dots">
					{scrollSnaps.map((_, index) => (
						<DotButton
							key={testimonials[index].id}
							onClick={() => onDotButtonClick(index)}
							className={"embla__dot".concat(
								index === selectedIndex ? " embla__dot--selected" : "",
							)}
						/>
					))}
				</div>
			</div>
		</section>
	);
}
