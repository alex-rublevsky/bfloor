import { cva, type VariantProps } from "class-variance-authority";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect } from "react";
import { Image } from "~/components/ui/shared/Image";
import { ASSETS_BASE_URL } from "~/constants/urls";
import { EmblaArrowButtons } from "./EmblaArrowButtons";
import { EmblaDotButtons } from "./EmblaDotButtons";
import "./image-gallery.css";

const mainImageVariants = cva(
	"max-w-full w-full lg:w-auto object-contain rounded-none lg:rounded-lg relative z-2",
	{
		variants: {
			size: {
				default: "max-h-[calc(100vh-5rem)]",
				compact: "max-h-[70vh]",
			},
		},
		defaultVariants: {
			size: "default",
		},
	},
);

interface ImageGalleryProps extends VariantProps<typeof mainImageVariants> {
	images: string[];
	alt: string;
	className?: string;
	productSlug?: string;
	viewTransitionName?: string;
}

export default function ImageGallery({
	images,
	alt,
	className = "",
	size,
	productSlug,
	viewTransitionName,
}: ImageGalleryProps) {
	// Determine the view transition name
	const transitionName = viewTransitionName || `product-image-${productSlug}`;

	// Desktop carousel (full-width, ~70% height, loop with snap)
	// Images are edge-to-edge, full height, auto width (maintains aspect ratio)
	// Snap behavior aligns leftmost visible image to left edge when scrolling
	const [emblaMainRef, emblaMainApi] = useEmblaCarousel(
		{
			loop: true,
			align: "start",
		},
		[],
	);

	// Mobile carousel (main image)
	const [emblaMobileRef, emblaMobileApi] = useEmblaCarousel(
		{
			loop: false,
			align: "center",
		},
		[],
	);

	// Mobile thumbnails carousel
	const [emblaThumbsRef, emblaThumbsApi] = useEmblaCarousel(
		{
			containScroll: "keepSnaps",
			dragFree: true,
		},
		[],
	);

	// Desktop navigation - handled by EmblaArrowButtons and EmblaDotButtons components

	// Sync mobile thumbnails with main carousel
	const onThumbClick = useCallback(
		(index: number) => {
			if (!emblaMobileApi || !emblaThumbsApi) return;
			emblaMobileApi.scrollTo(index);
		},
		[emblaMobileApi, emblaThumbsApi],
	);

	const onMobileSelect = useCallback(() => {
		if (!emblaMobileApi || !emblaThumbsApi) return;
		const selectedIndex = emblaMobileApi.selectedScrollSnap();
		emblaThumbsApi.scrollTo(selectedIndex);
	}, [emblaMobileApi, emblaThumbsApi]);

	useEffect(() => {
		if (!emblaMobileApi) return;
		onMobileSelect();
		emblaMobileApi.on("select", onMobileSelect).on("reInit", onMobileSelect);
	}, [emblaMobileApi, onMobileSelect]);

	if (!images.length) {
		return (
			<div className="w-full h-[75vh] bg-muted flex items-center justify-center rounded-lg relative">
				<div
					style={{
						viewTransitionName: transitionName,
						opacity: 0,
						position: "absolute",
					}}
					className="w-1 h-1"
				/>
				<p className="text-muted-foreground">No images available</p>
			</div>
		);
	}

	// Single image - simplified layout
	if (images.length === 1) {
		return (
			<div className={`w-full ${className}`}>
				{/* Desktop: Single image */}
				<div className="hidden lg:block w-full relative">
					<div className="overflow-hidden w-full h-[70vh] min-h-[500px]">
						<div className="flex h-full touch-pan-y touch-pinch-zoom gap-0">
							<div className="flex-shrink-0 min-w-0 h-full relative flex items-center justify-center m-0 p-0">
								<img
									src={`${ASSETS_BASE_URL}/${images[0]}`}
									alt={alt}
									width={3000}
									height={3000}
									loading="eager"
									className="w-auto h-full object-contain object-center rounded-none block"
									style={{ viewTransitionName: transitionName }}
								/>
							</div>
						</div>
					</div>
				</div>

				{/* Mobile: Single image */}
				<div className="lg:hidden">
					<div className="relative w-full aspect-square">
						<img
							src={`${ASSETS_BASE_URL}/${images[0]}`}
							alt={alt}
							width={3000}
							height={3000}
							loading="eager"
							className={`${mainImageVariants({ size })} block`}
							style={{ viewTransitionName: transitionName }}
						/>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className={`w-full ${className}`}>
			{/* Desktop: Full-width carousel */}
			<div className="hidden lg:block w-full relative">
				<div
					className="overflow-hidden w-full h-[70vh] min-h-[500px]"
					ref={emblaMainRef}
				>
					<div className="flex h-full touch-pan-y touch-pinch-zoom gap-0">
						{images.map((image, index) => (
							<div
								key={image}
								className="flex-shrink-0 min-w-0 h-full relative flex items-center justify-center m-0 p-0"
							>
								<img
									src={`${ASSETS_BASE_URL}/${image}`}
									alt={`${alt} ${index + 1}`}
									width={3000}
									height={3000}
									loading={index === 0 ? "eager" : "lazy"}
									className="w-auto h-full object-contain object-center rounded-none block"
									style={{
										viewTransitionName:
											index === 0 ? transitionName : undefined,
									}}
								/>
							</div>
						))}
					</div>
				</div>

				{/* Desktop Navigation Controls */}
				<div className="flex flex-row items-center gap-6 py-6 pl-4 justify-start">
					<EmblaArrowButtons
						emblaApi={emblaMainApi}
						variant="grid"
						size="small"
					/>

					<EmblaDotButtons
						emblaApi={emblaMainApi}
						itemKey={(index) => images[index]}
						size="small"
					/>
				</div>
			</div>

			{/* Mobile: Square main image with thumbnails */}
			<div className="lg:hidden w-full">
				{/* Main image carousel */}
				<div className="relative w-full aspect-square">
					<div className="overflow-hidden w-full h-full" ref={emblaMobileRef}>
						<div className="flex h-full touch-pan-y touch-pinch-zoom">
							{images.map((image, index) => (
								<div
									key={image}
									className="flex-shrink-0 min-w-0 h-full relative flex items-center justify-center w-full"
								>
									<div className="w-full h-full flex items-center justify-center">
										<Image
											src={`${ASSETS_BASE_URL}/${image}`}
											alt={`${alt} main image ${index + 1}`}
											width={3000}
											height={3000}
											className={mainImageVariants({ size })}
											style={{
												maxHeight: "100%",
												width: "auto",
												objectFit: "contain",
												viewTransitionName:
													index === 0 ? transitionName : undefined,
											}}
										/>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>

				{/* Thumbnails */}
				<div className="mt-2 px-4">
					<div className="overflow-hidden w-full" ref={emblaThumbsRef}>
						<div className="flex gap-2 py-2">
							{images.map((image, index) => {
								const isSelected =
									emblaMobileApi?.selectedScrollSnap() === index;
								return (
									<button
										key={image}
										type="button"
										aria-label={`View image ${index + 1}`}
										className={`image-gallery-mobile__thumb bg-transparent cursor-pointer border-2 p-0 m-0 flex-shrink-0 w-24 h-24 sm:w-20 sm:h-20 relative rounded-sm overflow-hidden transition-standard ${
											isSelected
												? "border-primary"
												: "border-transparent hover:border-primary"
										}`}
										style={{
											viewTransitionName: `gallery-thumb-${productSlug}-${index}`,
										}}
										onClick={() => onThumbClick(index)}
									>
										<div className="absolute inset-0 w-full h-full">
											<Image
												src={`${ASSETS_BASE_URL}/${image}`}
												alt={`${alt} thumbnail ${index + 1}`}
												className="w-full h-full object-cover rounded-none"
											/>
										</div>
									</button>
								);
							})}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
