/**
 * Cart Context
 *
 * Modern cart implementation using TanStack Query for state management.
 * Cart data is persisted in cookies via server functions for SSR compatibility.
 *
 * This eliminates:
 * - useEffect for loading/saving cookies
 * - useState for cart state
 * - Hydration mismatches
 * - Manual state synchronization
 *
 * Cart operations use optimistic updates for instant UI feedback.
 */

import type React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { toast } from "sonner";
import { getCartFromCookies } from "~/server_functions/cart";
import { setCookie } from "~/lib/cookies";
import type { Product, ProductVariation, ProductWithVariations } from "~/types";
import { useEnrichedCart } from "~/hooks/useEnrichedCart";

// Constants
const CART_COOKIE_NAME = "bfloor-cart";
const COOKIE_OPTIONS = {
	maxAge: 60 * 60 * 24 * 7, // 7 days
	path: "/",
} as const;

// Helper function to normalize variationId for consistent comparison
// Defined outside component to avoid recreation on every render
const normalizeVariationId = (variationId?: number | null): number | undefined => {
	return variationId ?? undefined;
};

// Types
/**
 * Minimal CartItem - only IDs and quantity
 * All other data (price, image, stock, etc.) is looked up from TanStack Query cache
 * This eliminates data duplication and ensures we always show current data
 */
export interface CartItem {
	productId: number;
	variationId?: number;
	quantity: number;
	addedAt: number; // Timestamp for sorting/debugging
}

export interface Cart {
	items: CartItem[];
	lastUpdated: number;
}

interface CartContextType {
	cart: Cart;
	cartOpen: boolean;
	setCartOpen: (open: boolean) => void;
	addToCart: (item: CartItem) => void;
	addProductToCart: (
		product: Product,
		quantity: number,
		selectedVariation?: ProductVariation | null,
	) => boolean;
	removeFromCart: (productId: number, variationId?: number) => void;
	updateQuantity: (
		productId: number,
		quantity: number,
		variationId?: number,
	) => void;
	clearCart: () => void;
	itemCount: number;
	isLoading: boolean;
	// Enriched items - computed once and shared across all components
	enrichedItems: ReturnType<typeof useEnrichedCart>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
	children: React.ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
	const queryClient = useQueryClient();
	const [cartOpen, setCartOpen] = useState(false);

	// Load cart from cookies (SSR-safe, no hydration issues)
	const { data: cart = { items: [], lastUpdated: Date.now() }, isLoading } = useQuery({
		queryKey: ["cart"],
		queryFn: () => getCartFromCookies(),
		staleTime: Number.POSITIVE_INFINITY, // Cart is always fresh (we control updates)
		gcTime: Number.POSITIVE_INFINITY, // Never garbage collect
	});

	// Get enriched cart items to calculate accurate count and validate items
	const enrichedItems = useEnrichedCart(cart.items);

	// Calculate itemCount from enriched items (only valid, active products)
	// This ensures the count matches what's actually displayed in the cart drawer
	const itemCount = useMemo(
		() => enrichedItems.reduce((count, item) => count + item.quantity, 0),
		[enrichedItems],
	);

	// Helper to update cart with optimistic updates
	// Memoized to prevent recreation on every render
	const updateCart = useCallback((updater: (prevCart: Cart) => Cart) => {
		const newCart = updater(cart);
		
		// Optimistic update - update UI immediately
		queryClient.setQueryData(["cart"], newCart);
		
		// Save to cookies (client-side)
		setCookie(CART_COOKIE_NAME, JSON.stringify(newCart), COOKIE_OPTIONS);
	}, [cart, queryClient]);

	// Add item to cart (or update quantity if exists)
	// Validation happens BEFORE calling this function
	// Memoized to prevent recreation on every render
	const addToCart = useCallback((item: CartItem) => {
		updateCart((prevCart) => {
			const normalizedItemVariationId = normalizeVariationId(item.variationId);

			const existingIndex = prevCart.items.findIndex((cartItem) => {
				const normalizedCartVariationId = normalizeVariationId(
					cartItem.variationId,
				);
				return (
					cartItem.productId === item.productId &&
					normalizedCartVariationId === normalizedItemVariationId
				);
			});

			let newItems: CartItem[];

			if (existingIndex >= 0) {
				// Update existing item quantity
				newItems = [...prevCart.items];
				newItems[existingIndex] = {
					...newItems[existingIndex],
					quantity: newItems[existingIndex].quantity + item.quantity,
				};
			} else {
				// Add new item (ensure variationId is normalized)
				newItems = [
					...prevCart.items,
					{
						...item,
						variationId: normalizedItemVariationId,
					},
				];
			}

			return {
				items: newItems,
				lastUpdated: Date.now(),
			};
		});

		// Open the cart drawer when adding an item
		setCartOpen(true);
	}, [updateCart]);

	// Combined function to add a product to cart using client-side validation
	// Memoized to prevent recreation on every render
	const addProductToCart = useCallback((
		product: Product,
		quantity: number,
		selectedVariation?: ProductVariation | null,
	): boolean => {
		try {
			// Basic validation
			if (!product?.id) {
				toast.error("Неверный товар");
				return false;
			}

			if (quantity <= 0) {
				toast.error("Неверное количество");
				return false;
			}

			// Validate product is active
			if (!product.isActive) {
				toast.error("Этот товар больше недоступен");
				return false;
			}

			// Validate variation requirement
			if (product.hasVariations && !selectedVariation) {
				toast.error("Пожалуйста, выберите вариант");
				return false;
			}

			if (!product.hasVariations && selectedVariation) {
				toast.error("Этот товар не поддерживает варианты");
				return false;
			}

			// Validate variation exists if product has variations
			if (product.hasVariations && selectedVariation) {
				const productWithVariations = product as ProductWithVariations;
				const variationExists = productWithVariations.variations?.some(
					(v) => v.id === selectedVariation.id,
				);
				if (!variationExists) {
					toast.error("Выбранный вариант не найден");
					return false;
				}
			}

			// Create minimal cart item - just IDs and quantity
			// All other data will be looked up from TanStack Query cache when needed
			const cartItem: CartItem = {
				productId: product.id,
				variationId: selectedVariation?.id,
				quantity: quantity,
				addedAt: Date.now(),
			};

			addToCart(cartItem);
			toast.success("Товар добавлен в корзину");
			return true;
		} catch (error) {
			console.error("Error adding product to cart:", error);
			toast.error("Не удалось добавить товар в корзину");
			return false;
		}
	}, [addToCart]);

	// Remove item from cart
	// Memoized to prevent recreation on every render
	const removeFromCart = useCallback((productId: number, variationId?: number) => {
		updateCart((prevCart) => {
			const normalizedVariationId = normalizeVariationId(variationId);
			const newItems = prevCart.items.filter((item) => {
				const normalizedItemVariationId = normalizeVariationId(
					item.variationId,
				);
				return !(
					item.productId === productId &&
					normalizedItemVariationId === normalizedVariationId
				);
			});

			return {
				items: newItems,
				lastUpdated: Date.now(),
			};
		});
	}, [updateCart]);

	// Update item quantity
	// Validation happens BEFORE calling this function
	// Memoized to prevent recreation on every render
	const updateQuantity = useCallback((
		productId: number,
		quantity: number,
		variationId?: number,
	) => {
		// If quantity is 0 or less, remove the item
		if (quantity <= 0) {
			removeFromCart(productId, variationId);
			return;
		}

		// Update quantity (enforce minimum of 1)
		updateCart((prevCart) => {
			const normalizedVariationId = normalizeVariationId(variationId);
			return {
				items: prevCart.items.map((item) => {
					const normalizedItemVariationId = normalizeVariationId(
						item.variationId,
					);
					return item.productId === productId &&
						normalizedItemVariationId === normalizedVariationId
						? { ...item, quantity: Math.max(1, quantity) }
						: item;
				}),
				lastUpdated: Date.now(),
			};
		});
	}, [removeFromCart, updateCart]);

	// Clear the cart
	// Memoized to prevent recreation on every render
	const clearCart = useCallback(() => {
		updateCart(() => ({
			items: [],
			lastUpdated: Date.now(),
		}));
	}, [updateCart]);

	return (
		<CartContext.Provider
			value={{
				cart,
				cartOpen,
				setCartOpen,
				addToCart,
				addProductToCart,
				removeFromCart,
				updateQuantity,
				clearCart,
				itemCount,
				isLoading,
				enrichedItems,
			}}
		>
			{children}
		</CartContext.Provider>
	);
}

export function useCart() {
	const context = useContext(CartContext);
	if (context === undefined) {
		throw new Error("useCart must be used within a CartProvider");
	}
	return context;
}
