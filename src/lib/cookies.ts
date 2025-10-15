// Client-side cookie handling for TanStack application

// TypeScript declarations for Cookie Store API
declare global {
	interface Document {
		cookieStore?: {
			set(
				name: string,
				value: string,
				options?: {
					expires?: Date;
					path?: string;
					domain?: string;
					secure?: boolean;
					sameSite?: "strict" | "lax" | "none";
				},
			): Promise<void>;
			delete(name: string, options?: { path?: string }): Promise<void>;
		};
	}
}

/**
 * Get a cookie value by name
 * @param name The name of the cookie to get
 * @returns The cookie value or undefined if not found
 */
export function getCookie(name: string): string | undefined {
	if (typeof document === "undefined") return undefined;

	// Use Cookie Store API if available (modern browsers)
	if (typeof document.cookieStore !== "undefined") {
		// Cookie Store API is async, but we need sync behavior for compatibility
		// We'll use the legacy method for now, but this could be updated to async if needed
	}

	// Legacy method for compatibility
	const cookies = document.cookie.split(";");
	for (let i = 0; i < cookies.length; i++) {
		const cookie = cookies[i].trim();
		if (cookie.startsWith(`${name}=`)) {
			return decodeURIComponent(cookie.substring(name.length + 1));
		}
	}
	return undefined;
}

/**
 * Set a cookie with the given name, value and options
 * @param name The name of the cookie
 * @param value The value to store
 * @param options Cookie options like maxAge, path, etc.
 */
export function setCookie(
	name: string,
	value: string,
	options: {
		maxAge?: number;
		path?: string;
		domain?: string;
		secure?: boolean;
		sameSite?: "strict" | "lax" | "none";
	} = {},
): void {
	if (typeof document === "undefined") return;

	// Use Cookie Store API if available (modern browsers)
	if (typeof document.cookieStore !== "undefined") {
		document.cookieStore.set(name, value, {
			expires: options.maxAge
				? new Date(Date.now() + options.maxAge * 1000)
				: undefined,
			path: options.path,
			domain: options.domain,
			secure: options.secure,
			sameSite: options.sameSite,
		});
		return;
	}

	// Fallback to legacy document.cookie for older browsers
	const cookieOptions = [];

	if (options.maxAge) {
		cookieOptions.push(`max-age=${options.maxAge}`);
	}

	if (options.path) {
		cookieOptions.push(`path=${options.path}`);
	}

	if (options.domain) {
		cookieOptions.push(`domain=${options.domain}`);
	}

	if (options.secure) {
		cookieOptions.push("secure");
	}

	if (options.sameSite) {
		cookieOptions.push(`samesite=${options.sameSite}`);
	}

	const cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}${
		cookieOptions.length > 0 ? `; ${cookieOptions.join("; ")}` : ""
	}`;

	// biome-ignore lint/suspicious/noDocumentCookie: Fallback for browsers without Cookie Store API
	document.cookie = cookieString;
}

/**
 * Remove a cookie by name
 * @param name The name of the cookie to remove
 * @param path The path of the cookie (must match the path used when setting)
 */
export function removeCookie(name: string, path = "/"): void {
	if (typeof document === "undefined") return;

	// Use Cookie Store API if available (modern browsers)
	if (typeof document.cookieStore !== "undefined") {
		document.cookieStore.delete(name, { path });
		return;
	}

	// Fallback to legacy method
	setCookie(name, "", { maxAge: -1, path });
}
