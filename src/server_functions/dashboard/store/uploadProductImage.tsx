import { env } from "cloudflare:workers";
import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { ASSETS_BASE_URL } from "~/constants/urls";

const MAX_FILE_SIZE = 1.5 * 1024 * 1024; // 1.5MB
const MAX_SVG_SIZE = 5 * 1024 * 1024; // 5MB for SVG files (they can be larger)
const ALLOWED_TYPES = [
	"image/jpeg",
	"image/jpg",
	"image/png",
	"image/webp",
	"image/svg+xml",
];

interface UploadImageInput {
	fileData: string; // base64 encoded file
	fileName: string;
	fileType: string;
	fileSize: number;
	folder?: string;
	slug?: string; // product slug for subdirectory organization
	categorySlug?: string; // category slug for proper path structure
	productName?: string; // product name for proper file naming
}

export const uploadProductImage = createServerFn({ method: "POST" })
	.inputValidator((data: UploadImageInput) => data)
	.handler(async ({ data }) => {
		try {
			const {
				fileData,
				fileName,
				fileType,
				fileSize,
				folder = "products",
				slug,
				categorySlug,
				productName,
			} = data;

			if (!fileData) {
				console.error("🖥️ Server: No file data provided");
				setResponseStatus(400);
				throw new Error("No file provided");
			}

			// Validate file type
			// Also check file extension for SVG (some browsers may not set MIME type correctly)
			const isSvg =
				fileType === "image/svg+xml" || fileName.toLowerCase().endsWith(".svg");
			if (!ALLOWED_TYPES.includes(fileType) && !isSvg) {
				console.error("🖥️ Server: Invalid file type:", fileType);
				setResponseStatus(400);
				throw new Error(
					"Invalid file type. Only JPEG, PNG, WebP, and SVG images are allowed.",
				);
			}

			// Validate file size (SVG files can be larger)
			const maxSize = isSvg ? MAX_SVG_SIZE : MAX_FILE_SIZE;
			if (fileSize > maxSize) {
				console.error("🖥️ Server: File too large:", fileSize, "bytes");
				setResponseStatus(400);
				throw new Error(
					isSvg
						? "SVG file size must be less than 5MB"
						: "File size must be less than 1.5MB",
				);
			}

			// File validation passed

			// Resolve R2 bucket binding (supports new and legacy names)
			const bucket = env.BFLOOR_STORAGE as R2Bucket;

			if (!bucket) {
				console.error("🖥️ Server: Storage bucket not configured");
				setResponseStatus(500);
				throw new Error("Storage bucket not configured");
			}

			// R2 bucket found

			// Helper function to sanitize filename
			const sanitizeFilename = (name: string): string => {
				return name
					.toLowerCase()
					.replace(/[^a-z0-9.-]/g, "-") // Replace non-alphanumeric chars with dash
					.replace(/-+/g, "-") // Replace multiple dashes with single dash
					.replace(/^-|-$/g, ""); // Remove leading/trailing dashes
			};

			// Use original filename, sanitized
			const sanitizedFileName = sanitizeFilename(fileName);
			// For SVG files, always use .svg extension regardless of filename
			let extension = sanitizedFileName.split(".").pop() || "jpg";
			if (isSvg) {
				extension = "svg";
			}

			// Handle empty filename case (e.g., when productName was empty)
			const lastDotIndex = sanitizedFileName.lastIndexOf(".");
			let nameWithoutExt =
				lastDotIndex > 0
					? sanitizedFileName.substring(0, lastDotIndex)
					: sanitizedFileName;

			// If nameWithoutExt is empty or only dots/dashes, use timestamp
			if (!nameWithoutExt || nameWithoutExt.replace(/[.-]/g, "").length === 0) {
				const timestamp = Date.now();
				nameWithoutExt = `image-${timestamp}`;
			}

			// Create directory path with proper structure: products/category/productName
			// Special cases: country-flags and brands should be stored in a single directory without subdirectories
			let directoryPath = folder;

			if (folder === "country-flags" || folder === "brands") {
				// Country flags and brand logos go directly in their respective folders, no subdirectories
				directoryPath = folder;
			} else if (
				categorySlug &&
				productName &&
				categorySlug.trim() &&
				productName.trim()
			) {
				const sanitizedCategorySlug = sanitizeFilename(categorySlug);
				const sanitizedProductName = sanitizeFilename(productName);
				directoryPath = `${folder}/${sanitizedCategorySlug}/${sanitizedProductName}`;
			} else if (slug?.trim()) {
				// Fallback to old structure for backward compatibility (only for products)
				directoryPath = `${folder}/${slug}`;
			} else {
				// Use timestamp-based folder for new products without proper data
				const timestamp = Date.now();
				directoryPath = `${folder}/temp-${timestamp}`;
			}

			// Check if file exists and find available name
			let finalName = nameWithoutExt;
			let filename = `${directoryPath}/${finalName}.${extension}`;
			let copyNumber = 0;

			// Check if file exists in R2
			while (await bucket.head(filename)) {
				copyNumber++;
				finalName = `${nameWithoutExt}-copy${copyNumber > 1 ? copyNumber : ""}`;
				filename = `${directoryPath}/${finalName}.${extension}`;
			}

			// Convert base64 to ArrayBuffer
			const base64Data = fileData.split(",")[1] || fileData;
			const binaryString = atob(base64Data);
			const bytes = new Uint8Array(binaryString.length);
			for (let i = 0; i < binaryString.length; i++) {
				bytes[i] = binaryString.charCodeAt(i);
			}

			// Proceed to upload to R2

			// Upload to R2
			await bucket.put(filename, bytes.buffer, {
				httpMetadata: {
					// Ensure SVG files get the correct content type
					contentType: isSvg ? "image/svg+xml" : fileType,
				},
			});

			// Upload to R2 successful

			// Return the filename (path in R2)
			const result = {
				success: true,
				filename,
				url: `${ASSETS_BASE_URL}/${filename}`,
			};

			return result;
		} catch (error) {
			console.error("🖥️ Server: Error uploading image:", error);
			console.error("🖥️ Server: Error details:", {
				message: error instanceof Error ? error.message : "Unknown error",
				stack: error instanceof Error ? error.stack : undefined,
				name: error instanceof Error ? error.name : undefined,
			});
			setResponseStatus(500);
			throw new Error(
				error instanceof Error ? error.message : "Failed to upload image",
			);
		}
	});
