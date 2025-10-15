import * as React from "react";
import { cn } from "~/lib/utils";
import cloudflareLoader from "~/utils/image-loader";

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
	width?: number;
	quality?: number;
}

const Image = React.forwardRef<HTMLImageElement, ImageProps>(
	({ className, src, width, quality, alt, loading, style, ...props }, ref) => {
		const imageSrc = src
			? cloudflareLoader({ src, width: width || 0, quality })
			: "";

		return (
			<img
				ref={ref}
				src={imageSrc}
				alt={alt}
				loading={loading}
				style={style}
				className={cn("object-cover", className)}
				{...props}
			/>
		);
	},
);

Image.displayName = "Image";

export { Image, type ImageProps };
