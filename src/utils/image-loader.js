const ASSETS_URL = "https://pub-aecfacef31684b0aa951c03db5f14d4e.r2.dev";

export default function cloudflareLoader({ src, width, quality }) {
	// If the source is already a full URL, use it as is
	if (src.startsWith("https://")) {
		return src;
	}

	// Remove leading slash if present to avoid double slashes
	const cleanSrc = src.startsWith("/") ? src.slice(1) : src;

	const params = [`width=${width}`];
	if (quality) {
		params.push(`quality=${quality}`);
	}

	// Add format=auto to let Cloudflare automatically choose the best format
	params.push("format=auto");

	// Add fit=cover to maintain aspect ratio when resizing
	params.push("fit=cover");

	const queryString = params.join("&");
	return `${ASSETS_URL}/${cleanSrc}?${queryString}`;
}
