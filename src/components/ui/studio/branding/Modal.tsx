import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Image } from "~/components/ui/shared/Image";
import type { BrandingProject } from "./brandingTypes";
//import { unstable_ViewTransition as ViewTransition } from "react";

export default function Modal({
	selected,
	setSelected,
}: {
	selected: BrandingProject | null;
	setSelected: (project: BrandingProject | null) => void;
}) {
	const [mounted, setMounted] = useState(false);
	const [selectedGalleryImage, setSelectedGalleryImage] = useState<
		string | null
	>(null);

	useEffect(() => {
		setMounted(true);
		return () => setMounted(false);
	}, []);

	useEffect(() => {
		if (selected) {
			document.body.style.overflow = "hidden";
			setSelectedGalleryImage(null);
		} else {
			document.body.style.overflow = "unset";
		}

		return () => {
			document.body.style.overflow = "unset";
		};
	}, [selected]);

	if (!mounted) {
		return null;
	}

	const modal = (
		<AnimatePresence mode="wait">
			{selected && (
				<motion.div
					key="modal-backdrop"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.3, delay: 0 }}
					className="p-2 lg:p-4 not-first:fixed inset-0 h-auto z-50 cursor-pointer flex items-center justify-center bg-background/40 backdrop-blur-2xl"
					onClick={() => setSelected(null)}
				>
					<motion.div
						key="modal-content"
						initial={{ opacity: 0, scale: 0.95, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: 20 }}
						transition={{ duration: 0.3, ease: "easeOut" }}
						className="h-full w-full max-w-7xl cursor-default overflow-y-auto overflow-x-hidden scrollbar-none bg-background lg:p-4 rounded-2xl"
						onClick={(e) => e.stopPropagation()}
					>
						{(() => {
							// The displayed image is either the selected gallery image or the first image (maintaining layout animation)
							const displayedImage =
								selected.type === "image"
									? selectedGalleryImage || selected.images?.[0]
									: null;
							return (
								<div className="relative flex flex-col lg:flex-row h-auto gap-2">
									{/* Close button - styled like navbar back buttons */}
									<motion.div
										initial={{ opacity: 0, scale: 0.8 }}
										animate={{ opacity: 1, scale: 1 }}
										transition={{ duration: 0.3, delay: 0.1 }}
										className="fixed bottom-0 left-0 right-0 z-[60] mb-3 flex justify-start items-center px-3 pointer-events-none"
									>
										<div className="pointer-events-auto">
											<div className="relative flex w-fit rounded-full border border-black bg-background hover:bg-primary hover:text-primary-foreground active:bg-primary active:text-primary-foreground transition-all duration-300 p-[0.3rem]">
												<button
													type="button"
													onClick={() => setSelected(null)}
													className="relative z-10 flex items-center gap-2 cursor-pointer px-3 py-1.5 text-xs text-primary-foreground mix-blend-difference md:px-4 md:py-2 md:text-sm"
												>
													<X className="h-4 w-4" />
													Close project
												</button>
											</div>
										</div>
									</motion.div>

									{/* Thumbnails column - desktop only */}
									{selected.type === "image" &&
										selected.images &&
										selected.images.length > 1 && (
											<motion.div className="hidden lg:block shrink-0 w-24 overflow-y-auto">
												<div className="flex flex-col gap-2">
													{selected.images.map((image, index) => (
														<motion.div
															key={image}
															initial={{ opacity: 0, scale: 0.8 }}
															animate={{ opacity: 1, scale: 1 }}
															transition={{
																duration: 0.3,
																delay: 0.3 + index * 0.05,
																ease: "easeOut",
															}}
															className="shrink-0 w-24 h-24 relative cursor-pointer"
															onMouseEnter={() =>
																setSelectedGalleryImage(image)
															}
														>
															<div
																className={`
                        absolute inset-0
                        rounded-sm
                        ${displayedImage === image ? "border-2 border-black" : "border border-transparent"}
                        transition-colors duration-200
                        pointer-events-none
                        z-10
                      `}
															/>
															<div className="absolute inset-0 rounded-sm overflow-hidden">
																<img
																	src={`https://assets.rublevsky.studio/${image}`}
																	alt={`${selected.name} thumbnail ${index + 1}`}
																	className="object-cover h-full w-full"
																/>
															</div>
														</motion.div>
													))}
												</div>
											</motion.div>
										)}

									{/* Main image container */}
									<div className="flex items-center  justify-center lg:items-start lg:justify-start lg:grow relative pl-4 lg:pl-0 pr-4 lg:pr-0 pt-4 lg:pt-0">
										{selected.type === "image" ? (
											<div className="relative  w-full lg:w-auto lg:h-[60vh] flex items-center lg:items-start justify-center">
												{/* <ViewTransition key={displayedImage}> */}
												<motion.img
													layoutId={`card-${selected.id}`}
													transition={{ duration: 0.3 }}
													//style={{ viewTransitionName: `branding-image` }}
													src={`https://assets.rublevsky.studio/${displayedImage}`}
													alt={selected.name}
													width={1000}
													height={1000}
													className="w-auto h-auto max-w-full max-h-[60dvh] lg:max-h-[calc(100vh-4rem)] object-contain rounded-lg relative z-2"
												/>
												{/* </ViewTransition> */}
											</div>
										) : (
											<motion.video
												layoutId={`card-${selected.id}`}
												src={`https://assets.rublevsky.studio/${selected.src}`}
												className="w-full h-full overflow-hidden rounded-lg object-contain"
												muted
												autoPlay={true}
												loop={true}
												playsInline
											/>
										)}
									</div>

									{/* Mobile thumbnails */}
									{selected.type === "image" &&
										selected.images &&
										selected.images.length > 1 && (
											<motion.div
												initial={{ opacity: 0, y: 20 }}
												animate={{ opacity: 1, y: 0 }}
												transition={{ duration: 0.5, delay: 0.2 }}
												className="mt-1 lg:hidden"
											>
												<div className="overflow-x-auto scrollbar-none">
													<div className="flex gap-2 px-4 pb-2">
														{selected.images.map((image, index) => (
															<motion.div
																key={image}
																initial={{ opacity: 0, scale: 0.8 }}
																animate={{ opacity: 1, scale: 1 }}
																transition={{
																	duration: 0.3,
																	delay: 0.3 + index * 0.05,
																	ease: "easeOut",
																}}
																className="shrink-0 w-24 h-24 relative cursor-pointer"
																onMouseEnter={() =>
																	setSelectedGalleryImage(image)
																}
															>
																<div
																	className={`
                            absolute inset-0
                            rounded-sm
                            ${displayedImage === image ? "border-2 border-black" : "border border-transparent"}
                            transition-colors duration-200
                            pointer-events-none
                            z-10
                          `}
																/>
																<div className="absolute inset-0 rounded-sm overflow-hidden">
																	<Image
																		src={`https://assets.rublevsky.studio/${image}`}
																		alt={`${selected.name} thumbnail ${index + 1}`}
																		className="object-cover w-full h-full"
																	/>
																</div>
															</motion.div>
														))}
													</div>
												</div>
											</motion.div>
										)}

									{/* Details column */}
									<motion.div
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ duration: 0.5, delay: 0.2 }}
										className="lg:w-[37ch] lg:pl-6 pt-4 lg:pt-18 pb-20 lg:pb-0 shrink-0 overflow-y-auto mx-4 lg:mx-0 flex flex-col"
									>
										<div>
											<h3 className="text-2xl font-bold">{selected.name}</h3>

											{selected.description && (
												<div className="prose prose-sm dark:prose-invert mt-2 ">
													<p className="text-lg">{selected.description}</p>
												</div>
											)}

											{selected.logo && (
												<div className="flex items-center justify-start mt-4">
													<Image
														src={`/${selected.logo}`}
														alt={`${selected.name} logo`}
														width={64}
														height={64}
														className="object-contain w-38 md:w-44"
													/>
												</div>
											)}
										</div>
									</motion.div>
								</div>
							);
						})()}
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);

	return createPortal(modal, document.body);
}
