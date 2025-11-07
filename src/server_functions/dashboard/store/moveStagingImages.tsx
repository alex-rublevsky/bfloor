import { env } from "cloudflare:workers";
import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";

interface MoveStagingImagesInput {
	imagePaths: string[]; // Array of staging image paths to move
	finalFolder: string; // Final folder (e.g., "products")
	categorySlug?: string;
	productName?: string;
	slug?: string;
}

interface MoveStagingImagesResult {
	success: boolean;
	movedImages: string[];
	pathMap?: Record<string, string>; // Map of staging path -> final path
	failedImages?: string[];
}

/**
 * Move images from staging to final location
 * This is called after successful product save
 */
export const moveStagingImages = createServerFn({ method: "POST" })
	.inputValidator((data: MoveStagingImagesInput) => data)
	.handler(async ({ data }) => {
		try {
			const { imagePaths, finalFolder, categorySlug, productName, slug } = data;

			if (!imagePaths || imagePaths.length === 0) {
				return { success: true, movedImages: [] };
			}

			const bucket = env.BFLOOR_STORAGE as R2Bucket;

			if (!bucket) {
				setResponseStatus(500);
				throw new Error("Storage bucket not configured");
			}

			// Helper to sanitize filename
			const sanitizeFilename = (name: string): string => {
				return name
					.toLowerCase()
					.replace(/[^a-z0-9.-]/g, "-")
					.replace(/-+/g, "-")
					.replace(/^-|-$/g, "");
			};

			// Determine final directory path
			let finalDirectoryPath = finalFolder;

			if (finalFolder === "country-flags" || finalFolder === "brands") {
				finalDirectoryPath = finalFolder;
			} else if (categorySlug && productName) {
				const sanitizedCategorySlug = sanitizeFilename(categorySlug);
				const sanitizedProductName = sanitizeFilename(productName);
				finalDirectoryPath = `${finalFolder}/${sanitizedCategorySlug}/${sanitizedProductName}`;
			} else if (slug) {
				finalDirectoryPath = `${finalFolder}/${slug}`;
			}

			const movedImages: string[] = [];
			const pathMap: Record<string, string> = {}; // Map staging path -> final path
			const failedImages: string[] = [];

			console.log("🖥️ Moving staging images:", {
				imagePaths,
				finalDirectoryPath,
				count: imagePaths.length,
			});

			// Move each image from staging to final location
			for (const stagingPath of imagePaths) {
				try {
					// Check if it's a staging path
					if (!stagingPath.startsWith("staging/")) {
						// Already in final location, skip but add to map
						movedImages.push(stagingPath);
						pathMap[stagingPath] = stagingPath;
						console.log(`Skipping non-staging path: ${stagingPath}`);
						continue;
					}

					console.log(`Moving staging image: ${stagingPath}`);

					// Get the file from staging
					const stagingObject = await bucket.get(stagingPath);
					if (!stagingObject) {
						console.warn(`⚠️ Staging file not found: ${stagingPath}`);
						failedImages.push(stagingPath);
						continue;
					}

					// Extract filename from staging path
					const filename = stagingPath.split("/").pop() || "";
					const finalPath = `${finalDirectoryPath}/${filename}`;

					// Check if final path already exists, add copy number if needed
					let finalPathToUse = finalPath;
					let copyNumber = 0;
					while (await bucket.head(finalPathToUse)) {
						copyNumber++;
						const extIndex = filename.lastIndexOf(".");
						const nameWithoutExt =
							extIndex > 0 ? filename.substring(0, extIndex) : filename;
						const ext = extIndex > 0 ? filename.substring(extIndex) : "";
						finalPathToUse = `${finalDirectoryPath}/${nameWithoutExt}-copy${copyNumber > 1 ? copyNumber : ""}${ext}`;
					}

					// Read staging file content - use body stream directly for better compatibility
					// R2Object.body is a ReadableStream, we can use it directly or convert to ArrayBuffer
					let fileContent: ArrayBuffer | ReadableStream;
					if (stagingObject.body) {
						// Convert ReadableStream to ArrayBuffer for put operation
						fileContent = await stagingObject.arrayBuffer();
					} else {
						throw new Error(`Staging object has no body: ${stagingPath}`);
					}

					console.log(`📤 Uploading to final location: ${finalPathToUse}`);

					// Upload to final location FIRST (before deleting staging)
					// Preserve all metadata from staging object
					const putResult = await bucket.put(finalPathToUse, fileContent, {
						httpMetadata: stagingObject.httpMetadata,
						customMetadata: stagingObject.customMetadata,
					});

					console.log(`✅ Put operation completed for: ${finalPathToUse}`, {
						etag: putResult?.etag,
					});

					// Verify the copy succeeded by checking if file exists in final location
					// Add a small delay to ensure eventual consistency
					await new Promise((resolve) => setTimeout(resolve, 100));

					const verifyFinal = await bucket.head(finalPathToUse);
					if (!verifyFinal) {
						throw new Error(
							`Failed to verify copy: file not found at ${finalPathToUse} after put operation`,
						);
					}

					console.log(`✅ Verified copy exists at: ${finalPathToUse}`, {
						size: verifyFinal.size,
						contentType: verifyFinal.httpMetadata?.contentType,
					});

					// Delete from staging AFTER successful copy and verification
					await bucket.delete(stagingPath);

					// Verify deletion succeeded
					const verifyDeleted = await bucket.head(stagingPath);
					if (verifyDeleted) {
						console.warn(
							`⚠️ Warning: Staging file still exists after delete: ${stagingPath}`,
						);
						// Don't fail - file might be cached, but log the warning
					} else {
						console.log(`✅ Verified deletion from staging: ${stagingPath}`);
					}

					movedImages.push(finalPathToUse);
					pathMap[stagingPath] = finalPathToUse;
				} catch (error) {
					console.error(
						`❌ Failed to move staging image ${stagingPath}:`,
						error,
					);
					console.error("Error details:", {
						message: error instanceof Error ? error.message : String(error),
						stack: error instanceof Error ? error.stack : undefined,
					});
					failedImages.push(stagingPath);
					// Continue with other images even if one fails
				}
			}

			console.log("🖥️ Move staging images result:", {
				movedCount: movedImages.length,
				failedCount: failedImages.length,
				pathMap,
				totalRequested: imagePaths.length,
			});

			// If we had staging images but none were moved successfully, that's an error
			const stagingPaths = imagePaths.filter((p) => p.startsWith("staging/"));
			if (
				stagingPaths.length > 0 &&
				movedImages.length === 0 &&
				failedImages.length === stagingPaths.length
			) {
				setResponseStatus(500);
				throw new Error(
					`Failed to move any staging images. All ${failedImages.length} image(s) failed to move.`,
				);
			}

			const result: MoveStagingImagesResult = {
				success: true,
				movedImages,
				pathMap,
			};

			if (failedImages.length > 0) {
				result.failedImages = failedImages;
			}

			return result;
		} catch (error) {
			console.error("❌ Error moving staging images:", error);
			console.error("Error details:", {
				message: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
			});
			setResponseStatus(500);
			throw new Error(
				error instanceof Error
					? error.message
					: "Failed to move staging images",
			);
		}
	});
