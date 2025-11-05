import { useInfiniteQuery } from "@tanstack/react-query";
import type { UseEmblaCarouselType } from "embla-carousel-react";
import useEmblaCarousel from "embla-carousel-react";
import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	getProductTagName,
	PRODUCT_TAGS,
	type ProductTag,
} from "~/constants/units";
import {
	discountedProductsInfiniteQueryOptions,
	productsByTagInfiniteQueryOptions,
} from "~/lib/queryOptions";
import type { ProductWithVariations } from "~/types";
import {
	NextButton,
	PrevButton,
	usePrevNextButtons,
} from "../home/testimonial/TestimonialArrows";
import {
	DotButton,
	useDotButton,
} from "../home/testimonial/TestimonialDotButton";
import ProductCard from "../store/ProductCard";
import "./product-slider.css";

type ProductSliderMode = "simple" | "tabs";

interface ProductSliderProps {
	mode?: ProductSliderMode;
	title: string;
	tags?: readonly ProductTag[];
}

export default function ProductSlider({
	mode = "simple",
	title,
	tags = PRODUCT_TAGS,
}: ProductSliderProps) {
	const [selectedTag, setSelectedTag] = useState<ProductTag | null>(
		mode === "tabs" ? tags[0] : null,
	);
	const scrollListenerRef = useRef<() => void>(() => undefined);
	const listenForScrollRef = useRef(true);
	const hasMoreToLoadRef = useRef(true);

	// Determine which query to use
	const queryOptions = useMemo(() => {
		if (mode === "tabs" && selectedTag) {
			return productsByTagInfiniteQueryOptions(selectedTag);
		}
		return discountedProductsInfiniteQueryOptions();
	}, [mode, selectedTag]);

	const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
		useInfiniteQuery(queryOptions);

	// Merge products from all pages
	const products = useMemo(() => {
		const allProducts =
			data?.pages
				?.flatMap((page) => page?.products ?? [])
				?.filter((product: ProductWithVariations) => product.isActive) ?? [];
		return allProducts;
	}, [data]);

	// Get total count from first page pagination (for tab buttons)
	const totalCount = useMemo(() => {
		return data?.pages?.[0]?.pagination?.totalCount ?? 0;
	}, [data]);

	// Update hasMoreToLoad ref when hasNextPage changes
	useEffect(() => {
		hasMoreToLoadRef.current = hasNextPage ?? false;
	}, [hasNextPage]);

	const [emblaRef, emblaApi] = useEmblaCarousel(
		{
			loop: false,
			dragFree: true,
			watchSlides: (emblaApi) => {
				const reloadEmbla = (): void => {
					const oldEngine = emblaApi.internalEngine();
					emblaApi.reInit();
					const newEngine = emblaApi.internalEngine();

					// Copy engine modules to preserve scroll position
					const copyEngineModules = [
						"scrollBody",
						"location",
						"offsetLocation",
						"previousLocation",
						"target",
					];

					copyEngineModules.forEach((engineModule) => {
						// Engine internal API, types are not fully exposed
						const newEngineModule = newEngine as Record<string, object>;
						const oldEngineModule = oldEngine as Record<string, object>;
						Object.assign(
							newEngineModule[engineModule],
							oldEngineModule[engineModule],
						);
					});

					newEngine.translate.to(oldEngine.location.get());
					const { index } = newEngine.scrollTarget.byDistance(0, false);
					newEngine.index.set(index);
					newEngine.animation.start();

					listenForScrollRef.current = true;
				};

				const reloadAfterPointerUp = (): void => {
					emblaApi.off("pointerUp", reloadAfterPointerUp);
					reloadEmbla();
				};

				const engine = emblaApi.internalEngine();

				if (hasMoreToLoadRef.current && engine.dragHandler.pointerDown()) {
					const boundsActive = engine.limit.reachedMax(engine.target.get());
					engine.scrollBounds.toggleActive(boundsActive);
					emblaApi.on("pointerUp", reloadAfterPointerUp);
				} else {
					reloadEmbla();
				}
			},
		},
		[WheelGesturesPlugin()],
	);

	// Monitor scroll for infinite loading
	const onScroll = useCallback(
		(emblaApi: UseEmblaCarouselType[1]) => {
			if (!listenForScrollRef.current || !emblaApi) return;

			const lastSlide = emblaApi.slideNodes().length - 1;
			const lastSlideInView = emblaApi.slidesInView().includes(lastSlide);

			if (lastSlideInView && hasNextPage && !isFetchingNextPage) {
				listenForScrollRef.current = false;
				fetchNextPage();
			}
		},
		[hasNextPage, isFetchingNextPage, fetchNextPage],
	);

	const addScrollListener = useCallback(
		(emblaApi: UseEmblaCarouselType[1]) => {
			if (!emblaApi) return;
			scrollListenerRef.current = () => onScroll(emblaApi);
			emblaApi.on("scroll", scrollListenerRef.current);
		},
		[onScroll],
	);

	useEffect(() => {
		if (!emblaApi) return;
		addScrollListener(emblaApi);
	}, [emblaApi, addScrollListener]);

	// Reset scroll listener when fetching completes
	useEffect(() => {
		if (!isFetchingNextPage && products.length > 0) {
			listenForScrollRef.current = true;
		}
	}, [isFetchingNextPage, products.length]);

	// Reset carousel when tag changes
	useEffect(() => {
		if (emblaApi && mode === "tabs" && selectedTag) {
			emblaApi.scrollTo(0);
		}
	}, [emblaApi, selectedTag, mode]);

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
			{/* Header Row - Title/Tags and Arrows */}
			<div className="product-slider__header">
				<div className="product-slider__header-content">
					<h2>{title}</h2>
					{mode === "tabs" && (
						<div className="product-slider__tags">
							{tags.map((tag) => {
								const productCount =
									tag === selectedTag ? totalCount : undefined;

								return (
									<button
										key={tag}
										type="button"
										onClick={() => setSelectedTag(tag)}
										className={`product-slider__tag-button ${
											selectedTag === tag
												? "product-slider__tag-button--active"
												: ""
										}`}
										disabled={tag === selectedTag && productCount === 0}
									>
										{getProductTagName(tag)}
										{productCount !== undefined && productCount > 0 && (
											<span className="product-slider__tag-count">
												({productCount})
											</span>
										)}
									</button>
								);
							})}
						</div>
					)}
				</div>

				{/* Carousel Controls - shown when products are loaded */}
				{!isLoading && products.length > 0 && (
					<div className="product-slider__controls">
						<div className="embla__buttons">
							<PrevButton
								onClick={onPrevButtonClick}
								disabled={prevBtnDisabled}
							/>
							<NextButton
								onClick={onNextButtonClick}
								disabled={nextBtnDisabled}
							/>
						</div>
					</div>
				)}
			</div>

			{/* Loading State */}
			{isLoading && (
				<div className="product-slider__loading">
					<p className="text-muted-foreground">Загрузка товаров...</p>
				</div>
			)}

			{/* Empty State */}
			{!isLoading && products.length === 0 && (
				<div className="product-slider__empty">
					<p className="text-muted-foreground">
						{mode === "tabs"
							? "Нет товаров для выбранной категории"
							: "Нет товаров"}
					</p>
				</div>
			)}

			{/* Carousel */}
			{!isLoading && products.length > 0 && (
				<>
					{/* Carousel Viewport */}
					<div className="embla__viewport" ref={emblaRef}>
						<div className="embla__container">
							{products.map((product: ProductWithVariations) => (
								<div className="embla__slide" key={product.id}>
									<div className="px-1 md:px-1.5">
										<ProductCard product={product} />
									</div>
								</div>
							))}
							{/* Loading indicator when fetching more */}
							{hasNextPage && isFetchingNextPage && (
								<div className="embla__slide">
									<div className="px-1 md:px-1.5 flex items-center justify-center">
										<div className="text-muted-foreground">Загрузка...</div>
									</div>
								</div>
							)}
						</div>
					</div>

					{/* Dot Indicators */}
					{products.length > 1 && (
						<div className="embla__dots-container">
							<div className="embla__dots">
								{scrollSnaps.map((_, index) => (
									<DotButton
										key={`dot-${products[index]?.id ?? index}`}
										onClick={() => onDotButtonClick(index)}
										className={`embla__dot ${
											index === selectedIndex ? "embla__dot--selected" : ""
										}`}
									/>
								))}
							</div>
						</div>
					)}
				</>
			)}
		</section>
	);
}
