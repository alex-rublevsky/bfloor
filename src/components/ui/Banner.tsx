import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import { ASSETS_BASE_URL } from "~/constants/urls";

type EmblaOptionsType = Parameters<typeof useEmblaCarousel>[0];

type EmblaPropType = {
	slides: string[];
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
				className="embla-thumbs__slide__button"
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
		<section className="no-padding">
			<div className="embla">
				<div className="embla__viewport" ref={emblaMainRef}>
					<div className="embla__container">
						{slides.map((src, index) => (
							<div className="embla__slide" key={src}>
								<div className="embla__slide__number">
									<img
										src={src}
										alt={`banner ${index + 1}`}
										className="embla__slide__image"
									/>
								</div>
							</div>
						))}
					</div>
				</div>

				<div className="embla-thumbs">
					<div className="embla-thumbs__viewport" ref={emblaThumbsRef}>
						<div className="embla-thumbs__container">
							{slides.map((src, index) => (
								<Thumb
									key={`thumb-${src}`}
									onClick={() => onThumbClick(index)}
									selected={index === selectedIndex}
									index={index}
									src={src}
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
	border-radius: 1.8rem;
	font-size: 4rem;
	font-weight: 600;
	display: flex;
	align-items: center;
	justify-content: center;
	height: var(--slide-height);
	user-select: none;
}
  .embla__slide__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 1.8rem;
    display: block;
  }
.embla-thumbs {
	--thumbs-slide-spacing: 0.8rem;
	--thumbs-slide-height: 6rem;
	margin-top: var(--thumbs-slide-spacing);
}
.embla-thumbs__viewport {
	overflow: hidden;
}
.embla-thumbs__container {
	display: flex;
	flex-direction: row;
	margin-left: calc(var(--thumbs-slide-spacing) * -1);
}
.embla-thumbs__slide {
	flex: 0 0 22%;
	min-width: 0;
	padding-left: var(--thumbs-slide-spacing);
}
@media (min-width: 576px) {
	.embla-thumbs__slide {
		flex: 0 0 15%;
	}
}
.embla-thumbs__slide__number {
	border-radius: 1.8rem;
	-webkit-tap-highlight-color: rgba(var(--text-high-contrast-rgb-value), 0.5);
	-webkit-appearance: none;
	appearance: none;
	background-color: transparent;
	touch-action: manipulation;
	display: inline-flex;
	text-decoration: none;
	cursor: pointer;
	border: 0;
	padding: 0;
	margin: 0;
	box-shadow: inset 0 0 0 0.2rem var(--detail-medium-contrast);
	font-size: 1.8rem;
	font-weight: 600;
	color: var(--detail-high-contrast);
	display: flex;
	align-items: center;
	justify-content: center;
	height: var(--thumbs-slide-height);
	width: 100%;
}
.embla-thumbs__slide__button {
	border-radius: 1.8rem;
	-webkit-tap-highlight-color: rgba(var(--text-high-contrast-rgb-value), 0.5);
	-webkit-appearance: none;
	appearance: none;
	background-color: transparent;
	touch-action: manipulation;
	display: inline-flex;
	text-decoration: none;
	cursor: pointer;
	border: 0;
	padding: 0;
	margin: 0;
	box-shadow: inset 0 0 0 0.2rem var(--detail-medium-contrast);
	height: var(--thumbs-slide-height);
	width: 100%;
	overflow: hidden;
}
.embla-thumbs__slide__image {
	width: 100%;
	height: 100%;
	object-fit: cover;
	display: block;
	border-radius: 1.8rem;
}
.embla-thumbs__slide--selected .embla-thumbs__slide__number {
	color: var(--text-body);
}
`}</style>
			</div>
		</section>
	);
};

export function Banner() {
	const SLIDES: string[] = [
		`${ASSETS_BASE_URL}/banners/laminat-elochka.webp`,
		`${ASSETS_BASE_URL}/banners/nastennaya-probka-vsega-v-nalichii.webp`,
	];
	const OPTIONS: EmblaOptionsType = { loop: true };

	return <EmblaCarousel slides={SLIDES} options={OPTIONS} />;
}
