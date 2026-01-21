/**
 * useCartTotals Hook
 *
 * Calculates cart totals (subtotal, discount, total) from enriched cart items.
 * Centralizes calculation logic to avoid duplication across components.
 */

import { useMemo } from "react";
import type { EnrichedCartItem } from "./useEnrichedCart";

export interface CartTotals {
	subtotal: number;
	discountTotal: number;
	total: number;
}

export function useCartTotals(enrichedItems: EnrichedCartItem[]): CartTotals {
	return useMemo(() => {
		const subtotal = enrichedItems.reduce(
			(total, item) => total + item.price * item.quantity,
			0,
		);

		const discountTotal = enrichedItems.reduce((total, item) => {
			if (item.discount) {
				return total + (item.price * item.quantity * item.discount) / 100;
			}
			return total;
		}, 0);

		const total = subtotal - discountTotal;

		return { subtotal, discountTotal, total };
	}, [enrichedItems]);
}
