/**
 * Server functions for cart management
 * Handles cookie-based cart persistence with SSR support
 */

import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "~/lib/cookies";
import type { Cart } from "~/lib/cartContext";

const CART_COOKIE_NAME = "bfloor-cart";

/**
 * Get cart from cookies (SSR-safe)
 * Uses isomorphic getCookie that works on both server and client
 */
export const getCartFromCookies = createServerFn({ method: "GET" }).handler(
	async (): Promise<Cart> => {
		const stored = getCookie(CART_COOKIE_NAME);

		if (!stored) {
			return {
				items: [],
				lastUpdated: Date.now(),
			};
		}

		try {
			const parsed = JSON.parse(stored);
			return parsed;
		} catch {
			return {
				items: [],
				lastUpdated: Date.now(),
			};
		}
	},
);
