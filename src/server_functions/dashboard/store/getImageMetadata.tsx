import { env } from "cloudflare:workers";
import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";

interface GetImageMetadataInput {
	filename: string; // Full path in R2 (e.g., "products/category/product/image.jpg")
}

export interface ImageMetadata {
	size: number; // File size in bytes
	contentType?: string;
	etag?: string;
	uploaded?: Date;
}

export const getImageMetadata = createServerFn({ method: "POST" })
	.inputValidator((data: GetImageMetadataInput) => data)
	.handler(async ({ data }): Promise<ImageMetadata | null> => {
		try {
			const { filename } = data;

			if (!filename) {
				setResponseStatus(400);
				throw new Error("No filename provided");
			}

			const bucket = env.BFLOOR_STORAGE as R2Bucket;

			if (!bucket) {
				setResponseStatus(500);
				throw new Error("Storage bucket not configured");
			}

			// Use HEAD request to get metadata without downloading the file
			const object = await bucket.head(filename);

			if (!object) {
				// File doesn't exist
				return null;
			}

			// Return metadata
			return {
				size: object.size,
				contentType: object.httpMetadata?.contentType,
				etag: object.etag,
				uploaded: object.uploaded,
			};
		} catch (error) {
			console.error("Error getting image metadata:", error);
			setResponseStatus(500);
			throw new Error(
				error instanceof Error ? error.message : "Failed to get image metadata",
			);
		}
	});

