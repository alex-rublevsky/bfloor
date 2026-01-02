import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { getStorageBucket } from "~/utils/storage";

interface DeleteImageInput {
	filename: string; // Full path in R2 (e.g., "products/image.jpg")
}

export const deleteProductImage = createServerFn({ method: "POST" })
	.inputValidator((data: DeleteImageInput) => data)
	.handler(async ({ data }) => {
		try {
			const { filename } = data;

			if (!filename) {
				setResponseStatus(400);
				throw new Error("No filename provided");
			}

			const bucket = getStorageBucket();

			// Check if file exists
			const fileExists = await bucket.head(filename);

			if (!fileExists) {
				// File doesn't exist, but that's okay - maybe already deleted
				console.warn(`File not found in R2: ${filename}`);
				return {
					success: true,
					message: "File not found (may have been already deleted)",
				};
			}

			// Delete from R2
			await bucket.delete(filename);

			return {
				success: true,
				message: "Image deleted successfully",
			};
		} catch (error) {
			console.error("Error deleting image:", error);
			setResponseStatus(500);
			throw new Error(
				error instanceof Error ? error.message : "Failed to delete image",
			);
		}
	});
