import { Image } from "~/components/ui/shared/Image";
import { Link } from "../../shared/Link";

import DevicePreview from "./WebDevicePreview";
import type { Project } from "./webTypes";

type WebProjectEntryProps = {
	project: Project;
};

export default function WebProjectEntry({ project }: WebProjectEntryProps) {
	// Pre-find devices to ensure consistent rendering
	const phoneDevice = project.devices.find((d) => d.type === "phone");
	const tabletDevice = project.devices.find((d) => d.type === "tablet");

	const renderDevices = () => {
		switch (project.layout) {
			case "full":
				if (project.title === "BeautyFloor") {
					// Special layout for BeautyFloor
					return (
						<>
							<div className="col-span-12 lg:col-span-4 mb-6 lg:mb-0">
								<div className="space-y-4">
									<Image
										src={`/${project.devices[0].content.url}`}
										alt="BeautyFloor Screenshot 1"
										width={1200}
										height={800}
										className="w-[90%] mr-0 h-auto ml-auto rounded-lg"
									/>
									<Image
										src={`/${project.devices[1].content.url}`}
										alt="BeautyFloor Screenshot 2"
										width={1200}
										height={800}
										className="w-[90%] translate-y-[-10%] h-auto ml-0 rounded-lg"
									/>
									<div className="w-[66%] mr-0 relative translate-y-[-20%]">
										<Link
											href={project.websiteUrl}
											target="_blank"
											rel="noopener noreferrer"
											id={project.id}
											blurOnHover={false}
										>
											<Image
												src="/web/iphone-mockup.svg"
												alt="iPhone Mockup"
												width={375}
												height={812}
												className="w-full relative z-10"
											/>
											<Image
												src={`/${project.devices[2].content.url}`}
												alt="BeautyFloor Screenshot 3"
												width={375}
												height={812}
												className="absolute inset-[3%] top-[2%] bottom-[3.75%] w-[94%] h-[96%] object-cover rounded-[12%]"
											/>
										</Link>
									</div>
								</div>
							</div>
							<div className="col-span-12 lg:col-span-8">
								<div className="lg:sticky lg:top-8">
									{tabletDevice && (
										<DevicePreview
											device={tabletDevice}
											websiteUrl={project.websiteUrl}
											projectId={project.id}
										/>
									)}
								</div>
							</div>
						</>
					);
				}
				// Default full layout for other projects
				return (
					<>
						<div className="col-span-12 lg:col-span-4 mb-6 lg:mb-0">
							<div className="max-w-[300px] mx-auto lg:max-w-none">
								{phoneDevice && (
									<DevicePreview
										device={phoneDevice}
										websiteUrl={project.websiteUrl}
										projectId={project.id}
									/>
								)}
							</div>
						</div>
						<div className="col-span-12 lg:col-span-8">
							<div className="lg:sticky lg:top-8">
								{tabletDevice && (
									<DevicePreview
										device={tabletDevice}
										websiteUrl={project.websiteUrl}
										projectId={project.id}
									/>
								)}
							</div>
						</div>
					</>
				);

			case "tablet-only":
				return (
					<div className="col-span-12 lg:col-span-6">
						<div className="lg:sticky lg:top-8">
							{tabletDevice && (
								<DevicePreview
									device={tabletDevice}
									websiteUrl={project.websiteUrl}
									projectId={project.id}
								/>
							)}
						</div>
					</div>
				);

			case "stacked-images":
				return (
					<div className="col-span-12 lg:col-span-4 mb-6 lg:mb-0">
						<div className="space-y-4">
							{project.devices.map((device, index) => (
								<div
									key={device.content.url}
									className={`${
										index === 0
											? "w-[90%] mr-0 ml-auto"
											: index === 1
												? "w-[90%] translate-y-[-10%] ml-0"
												: "w-[66%] mr-0 relative translate-y-[-20%]"
									}`}
								>
									{device.type === "phone" ? (
										<DevicePreview
											device={device}
											websiteUrl={project.websiteUrl}
											projectId={project.id}
										/>
									) : (
										<Image
											src={`/${device.content.url}`}
											alt={`Screenshot ${index + 1}`}
											width={800}
											height={600}
											className="rounded-lg"
										/>
									)}
								</div>
							))}
						</div>
					</div>
				);

			default:
				return null;
		}
	};

	return (
		<div className="mb-52">
			<div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:gap-y-6">
				<div className="col-span-12 lg:col-span-8 mb-6 lg:mb-0">
					<h3 className="">{project.description}</h3>
				</div>
				<div className="col-span-12 lg:col-span-4 flex flex-col lg:items-end mb-6 lg:mb-0">
					<h4>Tools used:</h4>
					<div className="flex flex-wrap items-center lg:justify-end mt-4 mb-6 gap-6">
						{project.tools.map((tool, _index) =>
							tool.icon ? (
								<Image
									key={tool.name}
									src={`/${tool.icon}`}
									alt={tool.name}
									width={29}
									height={29}
									className={`w-auto logo-hover ${
										tool.largeIcon ? "h-[3.5rem] md:h-[4.5rem]" : "h-[1.8rem]"
									}`}
									//quality={100}
									style={{
										maxWidth: "unset",
									}}
								/>
							) : (
								<span
									key={tool.name}
									className={`text-gray-700 font-medium ${
										tool.largeIcon ? "text-2xl md:text-3xl" : "text-lg"
									}`}
								>
									{tool.name}
								</span>
							),
						)}
					</div>
					<h3>
						<Link
							href={project.websiteUrl}
							className="blurLink"
							target="_blank"
							rel="noopener noreferrer"
							id={`${project.id}`}
						>
							Live website
						</Link>
					</h3>
				</div>

				{renderDevices()}
			</div>
		</div>
	);
}
