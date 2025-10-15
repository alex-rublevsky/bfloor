import { motion } from "motion/react";
import { useCursorContext } from "~/components/ui/shared/custom_cursor/CustomCursorContext";
import { Image } from "~/components/ui/shared/Image";
import { brandingProjects } from "~/data/brandingData";
import type { BrandingProject } from "./brandingTypes";

type BrandingProjectCardProps = {
	project: BrandingProject;
	setSelected: (project: BrandingProject) => void;
};

const BrandingProjectCard = ({
	project,
	setSelected,
}: BrandingProjectCardProps) => {
	const { setVariant } = useCursorContext();

	const handleMouseEnter = () => {
		setVariant("enlarge");
	};
	const handleMouseLeave = () => setVariant("default");

	return (
		<motion.div
			whileHover={{
				scale: 1.025,
				transition: {
					duration: 0.25,
					ease: "easeInOut",
				},
			}}
			className="w-full mb-2 group grid grid-cols-1 grid-rows-1"
			id={`${project.id}`}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
		>
			{project.type === "image" ? (
				<motion.img
					whileTap={{ scale: 0.95 }}
					layoutId={`card-${project.id}`}
					id={`image-${project.id}`}
					src={`https://assets.rublevsky.studio/${project.images?.[0] || "placeholder.jpg"}`}
					alt={project.name}
					width={800}
					height={600}
					className="w-full rounded-lg cursor-pointer md:cursor-none col-start-1 row-start-1"
					loading="eager"
					onClick={() => setSelected(project)}
				/>
			) : (
				<motion.video
					layoutId={`card-${project.id}`}
					id={`video-${project.id}`}
					whileHover={{
						scale: 1.025,
						transition: {
							duration: 0.25,
							ease: "easeInOut",
						},
					}}
					whileTap={{ scale: 0.95 }}
					src={`https://assets.rublevsky.studio/${project.src}`}
					className="overflow-hidden rounded-lg cursor-pointer md:cursor-none w-full h-auto col-start-1 row-start-1"
					muted
					autoPlay={true}
					playsInline={true}
					loop={true}
					onClick={() => setSelected(project)}
				/>
			)}

			{(project.description || project.logo) && (
				<div className="col-start-1 row-start-1 self-end w-full p-2 pointer-events-none">
					<div className="py-4 px-2 bg-background/70 backdrop-blur-sm flex justify-between items-center opacity-0 transition-opacity duration-400 ease-in-out group-hover:opacity-100 rounded-md z-10">
						<div className="flex space-between items-center w-full">
							{project.description && (
								<p className="text-sm text-gray-800 flex-grow mr-2 line-clamp-2">
									{project.description}
								</p>
							)}
							{project.logo && (
								<Image
									src={`/${project.logo}`}
									alt={`${project.name} logo`}
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
};

export default function BrandingList({
	setSelected,
}: {
	setSelected: (project: BrandingProject) => void;
}) {
	return (
		<div className="columns-2 md:columns-3 2xl:columns-4 gap-3">
			{brandingProjects.map((project) => (
				<BrandingProjectCard
					key={project.id}
					project={project}
					setSelected={setSelected}
				/>
			))}
		</div>
	);
}
