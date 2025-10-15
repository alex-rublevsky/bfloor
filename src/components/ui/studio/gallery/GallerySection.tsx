import { useState } from "react";
import { photos } from "~/data/photographyData";
import { posters } from "~/data/postersData";
import GalleryItemComponent from "./GalleryItem";
import type { GalleryType } from "./galleryTypes";
import Carousel from "./LightboxCarousel";

type GallerySectionProps = {
	type: string;
};

export default function GallerySection({ type }: GallerySectionProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [currentIndex, setCurrentIndex] = useState(0);

	const galleryData = type === "photos" ? photos : posters;

	// Create a flat array of all images
	const allImages = galleryData.reduce((acc: string[], item) => {
		acc.push(...item.images);
		return acc;
	}, []);

	const openGallery = (index: number) => {
		// Calculate the starting index in the flat array based on the item index
		const startIndex = galleryData
			.slice(0, index)
			.reduce((acc, item) => acc + item.images.length, 0);
		setCurrentIndex(startIndex);
		setIsOpen(true);
	};

	const closeGallery = () => {
		setIsOpen(false);
	};

	return (
		<section id={type}>
			<h1
				className={"text-center work_page_section_title_holder"}
				data-heading-reveal
			>
				{type.charAt(0).toUpperCase() + type.slice(1)}
			</h1>

			<div className="columns-2 md:columns-3 2xl:columns-4 gap-3">
				{galleryData.map((item, index) => (
					<GalleryItemComponent
						key={item.id}
						item={item}
						index={index}
						onOpenGallery={openGallery}
						galleryType={type as GalleryType}
					/>
				))}
			</div>

			<Carousel
				isOpen={isOpen}
				onClose={closeGallery}
				images={allImages}
				initialIndex={currentIndex}
			/>
		</section>
	);
}
