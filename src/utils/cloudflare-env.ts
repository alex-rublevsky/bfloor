/**
 * Cloudflare Bindings Utility
 *
 * Handles Cloudflare bindings in both production and local development.
 *
 * In production: Uses cloudflare:workers env directly
 * In local dev: Uses cloudflare:workers env provided by @cloudflare/vite-plugin
 *
 * The @cloudflare/vite-plugin provides bindings from wrangler.jsonc configuration.
 */

/**
 * Cloudflare Secrets Store binding type
 */
type SecretsStoreBinding = {
	get(): Promise<string | null>;
};

/**
 * Resolves a Cloudflare Secrets Store binding to its string value
 *
 * @param value - The Secrets Store binding from env
 * @returns The resolved string value, or null if unavailable
 */
export async function resolveSecret(
	value: string | SecretsStoreBinding | null | undefined,
): Promise<string | null> {
	try {
		if (typeof value === "string") {
			return value;
		}

		if (!value) {
			return null;
		}

		// Secrets Store Fetcher object - call .get() to retrieve the secret
		if (typeof value === "object" && typeof value.get === "function") {
			const result = await value.get();
			return typeof result === "string" ? result : String(result);
		}

		console.warn("Secret not found or unexpected format:", typeof value);
		return null;
	} catch (error) {
		console.warn("Error resolving secret (will return null):", error);
		return null;
	}
}
