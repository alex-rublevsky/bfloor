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
			} = data;

			if (!fileData) {
				setResponseStatus(400);
				throw new Error("No file provided");
			}

			// Validate file type
			if (!ALLOWED_TYPES.includes(fileType)) {
				setResponseStatus(400);
				throw new Error(
					"Invalid file type. Only JPEG, PNG, and WebP images are allowed.",
				);
			}

			// Validate file size
			if (fileSize > MAX_FILE_SIZE) {
				setResponseStatus(400);
				throw new Error("File size must be less than 1.5MB");
			}

			// Get R2 bucket binding
			const bucket = env.RUBLEVSKY_STORAGE as R2Bucket;

			if (!bucket) {
				setResponseStatus(500);
				throw new Error("Storage bucket not configured");
			}

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

			// Create directory path with slug if provided
			const directoryPath = slug ? `${folder}/${slug}` : folder;

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

			// Upload to R2
			await bucket.put(filename, bytes.buffer, {
				httpMetadata: {
					contentType: fileType,
				},
			});

			// Return the filename (path in R2)
			return {
				success: true,
				filename,
				url: `${ASSETS_BASE_URL}/${filename}`,
			};
		} catch (error) {
			console.error("Error uploading image:", error);
			setResponseStatus(500);
			throw new Error(
				error instanceof Error ? error.message : "Failed to upload image",
			);
		}
	});
