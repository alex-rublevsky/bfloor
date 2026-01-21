// Isomorphic cookie handling for TanStack Start (SSR + Client)

import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

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
 * Parse cookie string into key-value pairs
 */
function parseCookieString(cookieString: string): Record<string, string> {
	const cookies: Record<string, string> = {};
	if (!cookieString) return cookies;

	cookieString.split(";").forEach((cookie) => {
		const [name, ...valueParts] = cookie.trim().split("=");
		if (name) {
			cookies[name] = decodeURIComponent(valueParts.join("="));
		}
	});
	return cookies;
}

/**
 * Get a cookie value by name (isomorphic - works on server and client)
 * @param name The name of the cookie to get
 * @returns The cookie value or undefined if not found
 */
export const getCookie = createIsomorphicFn()
	.client((name: string): string | undefined => {
		if (typeof document === "undefined") return undefined;

		// Legacy method for compatibility
		const cookies = document.cookie.split(";");
		for (let i = 0; i < cookies.length; i++) {
			const cookie = cookies[i].trim();
			if (cookie.startsWith(`${name}=`)) {
				return decodeURIComponent(cookie.substring(name.length + 1));
			}
		}
		return undefined;
	})
	.server((name: string): string | undefined => {
		const request = getRequest();
		if (!request) return undefined;

		const cookieHeader = request.headers.get("cookie");
		if (!cookieHeader) return undefined;

		const cookies = parseCookieString(cookieHeader);
		return cookies[name];
	});

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
