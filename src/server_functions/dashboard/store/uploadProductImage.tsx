import { env } from "cloudflare:workers";
import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { ASSETS_BASE_URL } from "~/constants/urls";

const MAX_FILE_SIZE = 1.5 * 1024 * 1024; // 1.5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

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
		console.log("🖥️ Server: Starting image upload process");
		console.log("🖥️ Server: Received data:", {
			fileName: data.fileName,
			fileType: data.fileType,
			fileSize: data.fileSize,
			folder: data.folder,
			slug: data.slug,
			categorySlug: data.categorySlug,
			productName: data.productName,
			fileDataLength: data.fileData?.length || 0,
		});

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
			if (!ALLOWED_TYPES.includes(fileType)) {
				console.error("🖥️ Server: Invalid file type:", fileType);
				setResponseStatus(400);
				throw new Error(
					"Invalid file type. Only JPEG, PNG, and WebP images are allowed.",
				);
			}

			// Validate file size
			if (fileSize > MAX_FILE_SIZE) {
				console.error("🖥️ Server: File too large:", fileSize, "bytes");
				setResponseStatus(400);
				throw new Error("File size must be less than 1.5MB");
			}

			console.log("🖥️ Server: File validation passed");

			// Resolve R2 bucket binding (supports new and legacy names)
			const bucket = env.BFLOOR_STORAGE as R2Bucket;

			if (!bucket) {
				console.error("🖥️ Server: Storage bucket not configured");
				setResponseStatus(500);
				throw new Error("Storage bucket not configured");
			}

			console.log("🖥️ Server: R2 bucket found");

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
			const extension = sanitizedFileName.split(".").pop() || "jpg";
			const nameWithoutExt = sanitizedFileName.substring(
				0,
				sanitizedFileName.lastIndexOf("."),
			);

			// Create directory path with proper structure: products/category/productName
			let directoryPath = folder;

			if (
				categorySlug &&
				productName &&
				categorySlug.trim() &&
				productName.trim()
			) {
				const sanitizedCategorySlug = sanitizeFilename(categorySlug);
				const sanitizedProductName = sanitizeFilename(productName);
				directoryPath = `${folder}/${sanitizedCategorySlug}/${sanitizedProductName}`;
			} else if (slug?.trim()) {
				// Fallback to old structure for backward compatibility
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

			console.log("🖥️ Server: About to upload to R2. Filename:", filename);
			console.log("🖥️ Server: File size:", bytes.buffer.byteLength, "bytes");

			// Upload to R2
			await bucket.put(filename, bytes.buffer, {
				httpMetadata: {
					contentType: fileType,
				},
			});

			console.log("🖥️ Server: Upload to R2 successful!");

			// Return the filename (path in R2)
			const result = {
				success: true,
				filename,
				url: `${ASSETS_BASE_URL}/${filename}`,
			};

			console.log("🖥️ Server: Returning result:", result);
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
