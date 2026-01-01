import { ASSETS_BASE_URL } from "~/constants/urls";

export default function cloudflareLoader({ src }) {
	// If the source is already a full URL, use it as is
	if (src.startsWith("https://")) {
		return src;
	}

	// Remove leading slash if present to avoid double slashes
	const cleanSrc = src.startsWith("/") ? src.slice(1) : src;

	// Check if the file is an SVG - SVGs should be served as-is without transformations
	const isSvg = cleanSrc.toLowerCase().endsWith(".svg");

	// For R2 storage, we serve files directly without Cloudflare Images transformations
	// Cloudflare Images transformations (format=auto, width, etc.) only work with Cloudflare Images service
	// Since we're using R2, we just return the direct URL
	if (isSvg) {
		// For SVG files, return the URL without any query parameters
		return `${ASSETS_BASE_URL}/${cleanSrc}`;
	}

	// For other image formats in R2, also serve directly without transformations
	// If you want to use Cloudflare Images transformations, you'd need to use Cloudflare Images service
	// For now, serve R2 files directly
	return `${ASSETS_BASE_URL}/${cleanSrc}`;
}
