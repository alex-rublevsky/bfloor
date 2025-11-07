import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import { ASSETS_BASE_URL } from "~/constants/urls";

type EmblaOptionsType = Parameters<typeof useEmblaCarousel>[0];

type SlideImage = {
	desktop: string;
	mobile: string;
};

type EmblaPropType = {
	slides: SlideImage[];
	options?: EmblaOptionsType;
};

type PropType = {
	selected: boolean;
	index: number;
	onClick: () => void;
	src: string;
};

export const Thumb: React.FC<PropType> = (props) => {
	const { selected, index, onClick, src } = props;

	return (
		<div
			className={"embla-thumbs__slide".concat(
				selected ? " embla-thumbs__slide--selected" : "",
			)}
		>
			<button
				onClick={onClick}
				type="button"
				className="embla-thumbs__slide__button aspect-[3/2]"
				aria-label={`Go to slide ${index + 1}`}
			>
				<img
					src={src}
					alt={`thumb ${index + 1}`}
					className="embla-thumbs__slide__image"
				/>
			</button>
		</div>
	);
};

const EmblaCarousel: React.FC<EmblaPropType> = (props) => {
	const { slides, options } = props;
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [emblaMainRef, emblaMainApi] = useEmblaCarousel(options);
	const [emblaThumbsRef, emblaThumbsApi] = useEmblaCarousel({
		containScroll: "keepSnaps",
		dragFree: true,
	});

	const onThumbClick = useCallback(
		(index: number) => {
			if (!emblaMainApi || !emblaThumbsApi) return;
			emblaMainApi.scrollTo(index);
		},
		[emblaMainApi, emblaThumbsApi],
	);

	const onSelect = useCallback(() => {
		if (!emblaMainApi || !emblaThumbsApi) return;
		setSelectedIndex(emblaMainApi.selectedScrollSnap());
		emblaThumbsApi.scrollTo(emblaMainApi.selectedScrollSnap());
	}, [emblaMainApi, emblaThumbsApi]);

	useEffect(() => {
		if (!emblaMainApi) return;
		onSelect();
		emblaMainApi.on("select", onSelect).on("reInit", onSelect);
	}, [emblaMainApi, onSelect]);

	return (
		<section className="no-padding pb-12">
			<div className="embla">
				<div className="embla__viewport" ref={emblaMainRef}>
					<div className="embla__container">
						{slides.map((slide, index) => (
							<div className="embla__slide" key={slide.desktop}>
								<div className="embla__slide__number">
									<picture>
										<source media="(min-width: 768px)" srcSet={slide.desktop} />
										<img
											src={slide.mobile}
											alt={`banner ${index + 1}`}
											className="embla__slide__image"
										/>
									</picture>
								</div>
							</div>
						))}
					</div>
				</div>

				<div className="embla-thumbs">
					<div className="embla-thumbs__viewport" ref={emblaThumbsRef}>
						<div className="embla-thumbs__container flex gap-3">
							{slides.map((slide, index) => (
								<Thumb
									key={`thumb-${slide.desktop}`}
									onClick={() => onThumbClick(index)}
									selected={index === selectedIndex}
									index={index}
									src={slide.mobile}
								/>
							))}
						</div>
					</div>
				</div>

				<style>{`
.embla {
	margin: auto;
	--slide-height: 19rem;
	--slide-spacing: 1rem;
	--slide-size: 100%;
}
.embla__viewport {
	overflow: hidden;
}
.embla__container {
	display: flex;
	touch-action: pan-y pinch-zoom;
	margin-left: calc(var(--slide-spacing) * -1);
}
.embla__slide {
	transform: translate3d(0, 0, 0);
	flex: 0 0 var(--slide-size);
	min-width: 0;
	padding-left: var(--slide-spacing);
}
.embla__slide__number {
	box-shadow: inset 0 0 0 0.2rem var(--detail-medium-contrast);
	overflow: hidden;
	user-select: none;
	position: relative;
	width: 100%;
	height: auto;
	border-radius: 0;
}
.embla__slide__number picture {
	display: block;
	width: auto;
	height: auto;
	border-radius: 0;
}
.embla__slide__image {
	width: auto;
	height: auto;
	min-width: 100%;
	display: block;
	object-position: left bottom;
	border-radius: 0;
}
@media (max-width: 767px) {
	.embla__slide__number {
		max-height: var(--slide-height);
		height: var(--slide-height);
	}
	.embla__slide__number picture {
		height: 100%;
	}
	.embla__slide__image {
		height: 100%;
		object-fit: cover;
		object-position: left center;
	}
}
@media (min-width: 768px) and (max-width: 1023px) {
	.embla__slide__number {
		height: 400px;
		min-height: 400px;
	}
	.embla__slide__number picture {
		height: 100%;
	}
	.embla__slide__image {
		height: 100%;
		object-fit: cover;
	}
}
@media (min-width: 1024px) and (max-width: 1399px) {
	.embla__slide__number {
		height: 500px;
		min-height: 500px;
	}
	.embla__slide__number picture {
		height: 100%;
	}
	.embla__slide__image {
		height: 100%;
		object-fit: cover;
	}
}
@media (min-width: 1400px) {
	.embla__slide__number {
		height: auto;
		min-height: 0;
		display: block;
	}
	.embla__slide__number picture {
		width: auto;
		height: auto;
		display: block;
		max-width: none;
	}
	.embla__slide__image {
		width: auto;
		height: auto;
		max-width: none;
		max-height: none;
		object-fit: none;
	}
}
.embla-thumbs {
	--thumbs-slide-spacing: 0.8rem;
	--thumbs-slide-height: 4rem;
	margin-top: var(--thumbs-slide-spacing);
}
@media (min-width: 768px) {
	.embla-thumbs {
		--thumbs-slide-height: 6rem;
	}
}
.embla-thumbs__viewport {
	overflow: hidden;
}
.embla-thumbs__slide {
	flex: 0 0 auto;
	min-width: 0;
}
.embla-thumbs__slide:first-child {
	padding-left: var(--thumbs-slide-spacing);
}
@media (min-width: 576px) {
	.embla-thumbs__slide {
		flex: 0 0 auto;
	}
}
.embla-thumbs__slide__button {
	border-radius: var(--radius-sm);
	-webkit-tap-highlight-color: rgba(var(--text-high-contrast-rgb-value), 0.5);
	-webkit-appearance: none;
	appearance: none;
	background-color: transparent;
	touch-action: manipulation;
	display: flex;
	align-items: flex-end;
	justify-content: flex-start;
	text-decoration: none;
	cursor: pointer;
	border: 1.5px solid transparent;
	padding: 0;
	margin: 0;
	box-shadow: inset 0 0 0 0.2rem var(--detail-medium-contrast);
	height: var(--thumbs-slide-height);
	overflow: hidden;
	transition: var(--transition-standard);
	box-sizing: border-box;
}
.embla-thumbs__slide__image {
	width: 100%;
	height: 100%;
	object-fit: cover;
	display: block;
	border-radius: 0;
	object-position: left bottom;
}
.embla-thumbs__slide--selected .embla-thumbs__slide__button {
	border-color: var(--accent);
}
`}</style>
			</div>
		</section>
	);
};

export function Banner() {
	const SLIDES: SlideImage[] = [
		{
			desktop: `${ASSETS_BASE_URL}/banners/elochka.webp`,
			mobile: `${ASSETS_BASE_URL}/banners/elochka-mobile.webp`,
		},
		{
			desktop: `${ASSETS_BASE_URL}/banners/cork.webp`,
			mobile: `${ASSETS_BASE_URL}/banners/cork-mobile.webp`,
		},
	];
	const OPTIONS: EmblaOptionsType = { loop: true };

	return <EmblaCarousel slides={SLIDES} options={OPTIONS} />;
}
