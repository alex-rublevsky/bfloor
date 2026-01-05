/**
 * Storage Utility
 *
 * Provides a unified storage interface compatible with R2 API
 * Uses AWS S3 SDK under the hood for Vercel/Nitro deployments
 */

import {
	DeleteObjectCommand,
	GetObjectCommand,
	HeadObjectCommand,
	ListObjectsV2Command,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { env } from "./env";

let s3Client: S3Client | null = null;

/**
 * Valid R2 region codes
 */
const VALID_R2_REGIONS = [
	"wnam",
	"enam",
	"weur",
	"eeur",
	"apac",
	"oc",
	"auto",
] as const;

/**
 * Maps AWS region names to R2 region codes
 * If the region is already a valid R2 code, returns it as-is
 */
function mapToR2Region(region: string | null): string {
	if (!region) {
		return "auto";
	}

	// If already a valid R2 region code, return it
	if (
		VALID_R2_REGIONS.includes(
			region.toLowerCase() as (typeof VALID_R2_REGIONS)[number],
		)
	) {
		return region.toLowerCase();
	}

	// Map AWS region names to R2 region codes
	const awsToR2Map: Record<string, string> = {
		// Asia Pacific
		"ap-northeast-1": "apac", // Tokyo
		"ap-northeast-2": "apac", // Seoul
		"ap-northeast-3": "apac", // Osaka
		"ap-south-1": "apac", // Mumbai
		"ap-southeast-1": "apac", // Singapore
		"ap-southeast-2": "oc", // Sydney
		"ap-southeast-3": "apac", // Jakarta
		"ap-east-1": "apac", // Hong Kong

		// Oceania
		"ap-southeast-4": "oc", // Melbourne

		// US East
		"us-east-1": "enam", // N. Virginia
		"us-east-2": "enam", // Ohio

		// US West
		"us-west-1": "wnam", // N. California
		"us-west-2": "wnam", // Oregon

		// Europe
		"eu-west-1": "weur", // Ireland
		"eu-west-2": "weur", // London
		"eu-west-3": "weur", // Paris
		"eu-central-1": "eeur", // Frankfurt
		"eu-central-2": "eeur", // Zurich
		"eu-north-1": "eeur", // Stockholm
		"eu-south-1": "eeur", // Milan
		"eu-south-2": "eeur", // Spain

		// South America
		"sa-east-1": "enam", // São Paulo

		// Canada
		"ca-central-1": "enam", // Canada

		// Middle East
		"me-south-1": "eeur", // Bahrain
		"me-central-1": "eeur", // UAE

		// Africa
		"af-south-1": "eeur", // Cape Town
	};

	const normalizedRegion = region.toLowerCase();
	const r2Region = awsToR2Map[normalizedRegion];

	if (r2Region) {
		return r2Region;
	}

	// Default to "auto" if no mapping found
	console.warn(
		`Unknown region "${region}", defaulting to "auto". Valid R2 regions: ${VALID_R2_REGIONS.join(", ")}`,
	);
	return "auto";
}

function getS3Client(): S3Client {
	if (!s3Client) {
		const r2Region = mapToR2Region(env.AWS_REGION);
		const config: {
			region: string;
			credentials?: {
				accessKeyId: string;
				secretAccessKey: string;
			};
			endpoint?: string;
			forcePathStyle: boolean;
		} = {
			region: r2Region,
			// R2's S3-compatible API requires path-style addressing
			// This ensures bucket name is in the path, not the subdomain
			forcePathStyle: true,
		};

		if (env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY) {
			config.credentials = {
				accessKeyId: env.AWS_ACCESS_KEY_ID,
				secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
			};
		}

		if (env.AWS_S3_ENDPOINT) {
			// Ensure endpoint doesn't include bucket name in the path
			// R2 endpoint should be: https://<account-id>.r2.cloudflarestorage.com
			// NOT: https://<account-id>.r2.cloudflarestorage.com/bucket-name
			let endpoint = env.AWS_S3_ENDPOINT.trim();

			// Remove trailing slash
			endpoint = endpoint.replace(/\/+$/, "");

			// If bucket name is configured and endpoint ends with it, remove it
			if (bucketName) {
				const bucketNamePattern = new RegExp(
					`/${bucketName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/?$`,
					"i",
				);
				if (bucketNamePattern.test(endpoint)) {
					endpoint = endpoint.replace(bucketNamePattern, "");
				}
			}

			config.endpoint = endpoint;
		}

		s3Client = new S3Client(config);
	}

	return s3Client;
}

const bucketName = env.BFLOOR_STORAGE_BUCKET;

if (!bucketName) {
	console.warn(
		"Storage bucket name not configured. Storage operations will fail.",
	);
}

/**
 * Storage interface compatible with R2Bucket API
 */
export interface StorageBucket {
	put(
		key: string,
		value: ArrayBuffer | ReadableStream | string,
		options?: {
			httpMetadata?: {
				contentType?: string;
				cacheControl?: string;
			};
			customMetadata?: Record<string, string>;
		},
	): Promise<void>;

	head(key: string): Promise<{ size?: number; uploaded?: Date } | null>;

	delete(key: string): Promise<void>;

	list(options?: { prefix?: string; limit?: number }): Promise<{
		objects: Array<{
			key: string;
			uploaded?: Date;
			size?: number;
		}>;
		truncated: boolean;
	}>;

	get(key: string): Promise<{
		body: ReadableStream;
		size: number;
		httpMetadata?: {
			contentType?: string;
			cacheControl?: string;
		};
		customMetadata?: Record<string, string>;
		arrayBuffer?: () => Promise<ArrayBuffer>;
	} | null>;
}

class S3StorageBucket implements StorageBucket {
	async put(
		key: string,
		value: ArrayBuffer | ReadableStream | string,
		options?: {
			httpMetadata?: {
				contentType?: string;
				cacheControl?: string;
			};
			customMetadata?: Record<string, string>;
		},
	): Promise<void> {
		if (!bucketName) {
			throw new Error("Storage bucket not configured");
		}

		const client = getS3Client();

		// Convert value to Uint8Array
		let body: Uint8Array;
		if (value instanceof ArrayBuffer) {
			body = new Uint8Array(value);
		} else if (value instanceof ReadableStream) {
			// Convert ReadableStream to Uint8Array
			const chunks: Uint8Array[] = [];
			const reader = value.getReader();
			while (true) {
				const { done, value: chunk } = await reader.read();
				if (done) break;
				chunks.push(chunk);
			}
			const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
			body = new Uint8Array(totalLength);
			let offset = 0;
			for (const chunk of chunks) {
				body.set(chunk, offset);
				offset += chunk.length;
			}
		} else if (typeof value === "string") {
			body = new TextEncoder().encode(value);
		} else {
			throw new Error("Unsupported value type");
		}

		const command = new PutObjectCommand({
			Bucket: bucketName,
			Key: key,
			Body: body,
			ContentType: options?.httpMetadata?.contentType,
			CacheControl: options?.httpMetadata?.cacheControl,
			Metadata: options?.customMetadata,
		});

		await client.send(command);
	}

	async head(key: string): Promise<{ size?: number; uploaded?: Date } | null> {
		if (!bucketName) {
			return null;
		}

		try {
			const client = getS3Client();
			const command = new HeadObjectCommand({
				Bucket: bucketName,
				Key: key,
			});

			const response = await client.send(command);

			return {
				size: response.ContentLength,
				uploaded: response.LastModified,
			};
		} catch (error) {
			const err = error as {
				name?: string;
				$metadata?: { httpStatusCode?: number };
			};
			const statusCode = err.$metadata?.httpStatusCode;

			// Handle client errors (4xx) gracefully - treat as "file doesn't exist"
			// This includes 404 (Not Found) and 400 (Bad Request - invalid key format, etc.)
			if (
				err.name === "NotFound" ||
				statusCode === 404 ||
				statusCode === 400 ||
				(statusCode && statusCode >= 400 && statusCode < 500)
			) {
				// Log warning for non-404 errors to help debug issues
				if (statusCode !== 404 && statusCode !== undefined) {
					console.warn(
						`Storage head operation returned ${statusCode} for key "${key}":`,
						err.name || "Unknown error",
					);
				}
				return null;
			}

			// Re-throw server errors (5xx) and unexpected errors
			throw error;
		}
	}

	async delete(key: string): Promise<void> {
		if (!bucketName) {
			throw new Error("Storage bucket not configured");
		}

		const client = getS3Client();
		const command = new DeleteObjectCommand({
			Bucket: bucketName,
			Key: key,
		});

		await client.send(command);
	}

	async list(options?: { prefix?: string; limit?: number }): Promise<{
		objects: Array<{
			key: string;
			uploaded?: Date;
			size?: number;
		}>;
		truncated: boolean;
	}> {
		if (!bucketName) {
			return { objects: [], truncated: false };
		}

		const client = getS3Client();
		const command = new ListObjectsV2Command({
			Bucket: bucketName,
			Prefix: options?.prefix,
			MaxKeys: options?.limit,
		});

		const response = await client.send(command);

		return {
			objects:
				response.Contents?.map((obj) => ({
					key: obj.Key || "",
					uploaded: obj.LastModified,
					size: obj.Size,
				})) || [],
			truncated: response.IsTruncated || false,
		};
	}

	async get(key: string): Promise<{
		body: ReadableStream;
		size: number;
		httpMetadata?: {
			contentType?: string;
			cacheControl?: string;
		};
		customMetadata?: Record<string, string>;
		arrayBuffer?: () => Promise<ArrayBuffer>;
	} | null> {
		if (!bucketName) {
			return null;
		}

		try {
			const client = getS3Client();
			const command = new GetObjectCommand({
				Bucket: bucketName,
				Key: key,
			});

			const response = await client.send(command);

			if (!response.Body) {
				return null;
			}

			const size = response.ContentLength || 0;

			// Helper to convert AWS SDK body to ArrayBuffer
			const arrayBuffer = async (): Promise<ArrayBuffer> => {
				const body = response.Body;

				// Check if body has transformToByteArray method (AWS SDK v3)
				if (
					body &&
					typeof (
						body as unknown as {
							transformToByteArray?: () => Promise<Uint8Array>;
						}
					).transformToByteArray === "function"
				) {
					const bytes = await (
						body as unknown as {
							transformToByteArray: () => Promise<Uint8Array>;
						}
					).transformToByteArray();
					return bytes.buffer as ArrayBuffer;
				}

				// Check if body is a ReadableStream with getReader
				if (
					body &&
					typeof (
						body as unknown as { getReader?: () => ReadableStreamDefaultReader }
					).getReader === "function"
				) {
					const reader = (body as ReadableStream).getReader();
					const chunks: Uint8Array[] = [];
					while (true) {
						const { done, value } = await reader.read();
						if (done) break;
						chunks.push(value);
					}
					const totalLength = chunks.reduce(
						(acc, chunk) => acc + chunk.length,
						0,
					);
					const result = new Uint8Array(totalLength);
					let offset = 0;
					for (const chunk of chunks) {
						result.set(chunk, offset);
						offset += chunk.length;
					}
					return result.buffer as ArrayBuffer;
				}

				// Fallback: try to convert to Uint8Array directly
				if (body instanceof Uint8Array) {
					return body.buffer as ArrayBuffer;
				}

				throw new Error("Unsupported body type from S3 GetObject response");
			};

			// Create a dummy ReadableStream for compatibility
			// (actual reading happens through arrayBuffer method)
			const body = new ReadableStream({
				start(controller) {
					controller.close();
				},
			}) as ReadableStream;

			return {
				body,
				size,
				httpMetadata: {
					contentType: response.ContentType,
					cacheControl: response.CacheControl,
				},
				customMetadata: response.Metadata,
				arrayBuffer,
			};
		} catch (error) {
			const err = error as {
				name?: string;
				$metadata?: { httpStatusCode?: number };
			};
			if (err.name === "NoSuchKey" || err.$metadata?.httpStatusCode === 404) {
				return null;
			}
			throw error;
		}
	}
}

/**
 * Get the storage bucket instance
 * Compatible with R2Bucket interface
 */
export function getStorageBucket(): StorageBucket {
	return new S3StorageBucket();
}

// For backward compatibility with R2Bucket type
export type R2Bucket = StorageBucket;
