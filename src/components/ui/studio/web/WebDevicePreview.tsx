"use client";

import { Image } from "~/components/ui/shared/Image";
import Video from "~/components/ui/shared/Video";
import { Link } from "../../shared/Link";
import type { Device } from "./webTypes";

type DevicePreviewProps = {
	device: Device;
	websiteUrl: string;
	projectId: string;
};

export default function DevicePreview({
	device,
	websiteUrl,
	projectId,
}: DevicePreviewProps) {
	const isPhone = device.type === "phone";
	const mockupFileName = isPhone
		? "web/iphone-mockup.svg"
		: "web/ipad-mockup.svg";

	return (
		<Link
			blurOnHover={false}
			href={websiteUrl}
			className={`block w-full relative ${
				isPhone ? "aspect-[9/19.5]" : "aspect-4/3"
			}`}
			target="_blank"
			rel="noopener noreferrer"
			id={projectId}
			cursorType="visitWebsite"
		>
			<Image
				src={`/${mockupFileName}`}
				alt={`${device.type} Mockup`}
				className="absolute inset-0 w-full h-full object-contain z-10"
				width={isPhone ? 375 : 1024}
				height={isPhone ? 812 : 768}
			/>

			{device.content.type === "video" ? (
				<Video
					src={`/${device.content.url}`}
					className={`absolute ${
						isPhone
							? "inset-[3%] bottom-[3.75%] w-[94%] h-[93.25%] rounded-[12%] overflow-hidden"
							: "inset-[4%] w-[92%] h-[92%] rounded-[3%]"
					} object-cover`}
					autoPlay
					loop
					muted
					playsInline
				/>
			) : (
				<Image
					src={`/${device.content.url}`}
					alt="Screenshot"
					className={`absolute ${
						isPhone
							? "inset-[3%] bottom-[3.75%] w-[94%] h-[93.25%] rounded-[12%]"
							: "inset-[4%] w-[92%] h-[92%] rounded-[3%]"
					} object-cover`}
					width={isPhone ? 375 : 1024}
					height={isPhone ? 812 : 768}
				/>
			)}
		</Link>
	);
}
