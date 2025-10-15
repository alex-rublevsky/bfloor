import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Button } from "~/components/ui/shared/Button";
import { useCursorHover } from "~/components/ui/shared/custom_cursor/CustomCursorContext";
import { Image } from "~/components/ui/shared/Image";
import type {
	GalleryItem as GalleryItemType,
	GalleryType,
} from "./galleryTypes.ts";

//import styles from "./branding-photography.module.css";

type GalleryItemProps = {
	item: GalleryItemType;
	index: number;
	onOpenGallery: (index: number) => void;
	galleryType: GalleryType;
};

export default function GalleryItemComponent({
	item,
	index,
	onOpenGallery,
	galleryType: _galleryType,
}: GalleryItemProps) {
	const { handleMouseEnter, handleMouseLeave } = useCursorHover("enlarge");

	return (
		<motion.div
			//shadow-[0_5px_6px_rgb(0,0,0,0.08)]
			id={item.id}
			className="relative group transform-gpu rounded-lg overflow-hidden cursor-pointer md:cursor-none mb-3"
			onClick={() => onOpenGallery(index)}
			onMouseEnter={handleMouseEnter()}
			onMouseLeave={handleMouseLeave()}
			whileHover={{
				scale: 1.025,
			}}
			transition={{
				duration: 0.25,
				ease: "easeInOut",
			}}
		>
			{/* TODO: does this solve the problem on ios which needed custom css in branding-photography module? */}
			<div>
				<Image
					id={`${item.id}-main-image`}
					src={`/${item.images[0]}`}
					alt={`Photo ${index + 1}`}
					width={800}
					height={600}
					className="w-full h-auto transition-all duration-300 ease-in-out"
					loading="eager"
					//priority={true}
				/>
				{item.images.length > 1 && (
					<Image
						id={`${item.id}-hover-image`}
						src={`/${item.images[1]}`}
						alt={`Photo ${index + 1} (hover)`}
						width={800}
						height={600}
						className="w-full h-full object-cover absolute top-0 left-0 opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100"
						loading="eager"
						// priority={true}
					/>
				)}
			</div>

			{item.storeLink && (
				<Button
					asChild
					variant="default"
					size="lg"
					className="group-hover:opacity-100 opacity-0 backdrop-blur-md hover:bg-background/20 active:bg-background/20 absolute top-2 right-2 transition-all duration-300 ease-in-out"
				>
					<Link
						to="/store/$productId"
						params={{
							productId: item.storeLink,
						}}
					>
						Buy
					</Link>
				</Button>
			)}

			{(item.description || item.logo) && (
				<div className="absolute inset-0 mt-auto col-start-1 row-start-1 self-end w-full p-2 pointer-events-none">
					<div className="py-4 px-2 bg-background/70 backdrop-blur-sm flex justify-between items-center opacity-0 transition-opacity duration-400 ease-in-out group-hover:opacity-100 rounded-md z-10">
						<div className="flex space-between items-center w-full">
							{item.description && (
								<p className="text-sm text-gray-800 flex-grow mr-2 line-clamp-2">
									{item.description}
								</p>
							)}
							{item.logo && (
								<Image
									src={`/${item.logo}`}
									alt={`Photo ${index + 1} logo`}
									width={64}
									height={64}
									className="h-7 flex-shrink-0 box-shadow-none"
									loading="lazy"
								/>
							)}
						</div>
					</div>
				</div>
			)}
		</motion.div>
	);
}
