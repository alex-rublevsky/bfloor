// carousel.tsx
import { ChevronLeftIcon, ChevronRightIcon, X } from "lucide-react";
import {
	AnimatePresence,
	MotionConfig,
	motion,
	useMotionTemplate,
	useSpring,
} from "motion/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Image } from "~/components/ui/shared/Image";
import { cn } from "~/utils/utils";

type CarouselProps = {
	images: string[];
	isOpen: boolean;
	onClose: () => void;
	initialIndex?: number;
};

export default function Carousel({
	images,
	isOpen,
	onClose,
	initialIndex = 0,
}: CarouselProps) {
	const [index, setIndex] = useState(initialIndex);
	const [mounted, setMounted] = useState(false);

	const x = index * 100;
	const xSpring = useSpring(x, { bounce: 0 });
	const xPercentage = useMotionTemplate`-${xSpring}%`;

	useEffect(() => {
		setMounted(true);
		return () => setMounted(false);
	}, []);

	useEffect(() => {
		setIndex(initialIndex);
	}, [initialIndex]);

	useEffect(() => {
		xSpring.set(x);
	}, [x, xSpring]);

	useEffect(() => {
		function handleKeyPress(e: KeyboardEvent) {
			if (e.key === "Escape") {
				onClose();
			} else if (e.key === "ArrowLeft") {
				if (index > 0) {
					setIndex(index - 1);
				}
			} else if (e.key === "ArrowRight") {
				if (index < images.length - 1) {
					setIndex(index + 1);
				}
			}
		}

		if (isOpen) {
			document.addEventListener("keydown", handleKeyPress);
		}

		return () => {
			document.removeEventListener("keydown", handleKeyPress);
		};
	}, [index, isOpen, onClose, images.length]);

	if (!isOpen || !mounted) return null;

	const carousel = (
		<MotionConfig transition={{ type: "spring", bounce: 0 }}>
			<div className="fixed inset-0 bg-primary/90 z-50 py-4">
				<button
					type="button"
					onClick={onClose}
					className="absolute right-4 top-4 text-primary-foreground hover:text-gray-300 active:text-gray-300 z-50 cursor-pointer"
				>
					<X className="h-6 w-6" />
				</button>
				<div className="flex h-full flex-col">
					<div className="relative flex-1 flex items-center justify-center min-h-0">
						<motion.div
							style={{ x: xPercentage }}
							className="flex w-full h-full"
						>
							{images.map((image, i) => (
								<motion.img
									key={image}
									src={`https://assets.rublevsky.studio/${image}`}
									animate={{ opacity: i === index ? 1 : 0.4 }}
									className="w-full h-full flex-shrink-0 object-contain px-8"
									alt=""
								/>
							))}
						</motion.div>

						<AnimatePresence initial={false}>
							{index > 0 && (
								<motion.button
									type="button"
									initial={{ opacity: 0 }}
									animate={{ opacity: 0.7 }}
									exit={{ opacity: 0, pointerEvents: "none" }}
									whileHover={{ opacity: 1 }}
									className="absolute left-2 top-1/2 -mt-4 flex h-18 w-18 items-center justify-center rounded-full bg-background/20"
									onClick={() => setIndex(index - 1)}
								>
									<ChevronLeftIcon className="h-10 w-10 text-background" />
								</motion.button>
							)}
						</AnimatePresence>

						<AnimatePresence initial={false}>
							{index + 1 < images.length && (
								<motion.button
									type="button"
									initial={{ opacity: 0 }}
									animate={{ opacity: 0.7 }}
									exit={{ opacity: 0, pointerEvents: "none" }}
									whileHover={{ opacity: 1 }}
									className="absolute right-2 top-1/2 -mt-4 flex h-18 w-18 items-center justify-center rounded-full bg-background/20"
									onClick={() => setIndex(index + 1)}
								>
									<ChevronRightIcon className="h-10 w-10 text-background" />
								</motion.button>
							)}
						</AnimatePresence>
					</div>

					<div className="mt-4">
						<Thumbnails index={index} setIndex={setIndex} images={images} />
					</div>
				</div>
			</div>
		</MotionConfig>
	);

	return createPortal(carousel, document.body);
}

const COLLAPSED_WIDTH = 1.75; // Width for inactive thumbnails in rem
const COLLAPSED_ASPECT_RATIO = 0.5; // Width to height ratio for inactive thumbnails
const THUMBNAIL_HEIGHT = COLLAPSED_WIDTH / COLLAPSED_ASPECT_RATIO; // Calculate standard height in rem
const MARGIN = 0; // Margin for active thumbnail in rem
const GAP = 0.5; // Gap between thumbnails in rem

function Thumbnails({
	index,
	setIndex,
	images,
}: {
	index: number;
	setIndex: (value: number) => void;
	images: string[];
}) {
	// Calculate position to keep active thumbnail centered (convert rem to px for motion calculations)
	const x = -(index * (COLLAPSED_WIDTH * 16 + GAP * 16) + MARGIN * 16);
	const xSpring = useSpring(x, { bounce: 0 });

	useEffect(() => {
		xSpring.set(x);
	}, [x, xSpring]);

	return (
		<div className="flex h-14 justify-center overflow-visible">
			<motion.div
				style={{ x: xSpring }}
				className="flex gap-2 absolute left-1/2"
			>
				{images.map((image, i) => (
					<motion.button
						type="button"
						onClick={() => setIndex(i)}
						initial={false}
						animate={i === index ? "active" : "inactive"}
						variants={{
							active: {
								marginLeft: `${MARGIN}rem`,
								marginRight: `${MARGIN}rem`,
								width: "auto",
								height: `${THUMBNAIL_HEIGHT}rem`,
							},
							inactive: {
								width: `${COLLAPSED_WIDTH}rem`,
								height: `${THUMBNAIL_HEIGHT}rem`,
								marginLeft: 0,
								marginRight: 0,
							},
						}}
						className="shrink-0 relative"
						key={image}
					>
						<Image
							alt=""
							src={`https://assets.rublevsky.studio/${image}`}
							className={cn(
								"h-full object-cover",
								i === index ? "w-auto" : "w-full",
							)}
						/>
					</motion.button>
				))}
			</motion.div>
		</div>
	);
}
