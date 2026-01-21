/**
 * Cart Context
 *
 * Manages shopping cart state and operations.
 * Products data is now managed by TanStack Query.
 *
 * This context only handles:
 * - Cart items (stored in cookies)
 * - Cart operations (add, remove, update, clear)
 * - Cart UI state (open/closed)
 */

import type React from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getCookie, setCookie } from "~/lib/cookies";
import type { Product, ProductVariation, ProductWithVariations } from "~/types";
import { useEnrichedCart } from "~/hooks/useEnrichedCart";

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
		products?: ProductWithVariations[], // Pass products for validation
	) => Promise<boolean>;
	removeFromCart: (productId: number, variationId?: number) => void;
	updateQuantity: (
		productId: number,
		quantity: number,
		variationId?: number,
		products?: ProductWithVariations[], // Pass products for validation
	) => void;
	clearCart: () => void;
	itemCount: number;
	isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Cookie constant
const CART_COOKIE_NAME = "bfloor-cart";

interface CartProviderProps {
	children: React.ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
	const [cart, setCart] = useState<Cart>({
		items: [],
		lastUpdated: Date.now(),
	});
	const [cartOpen, setCartOpen] = useState(false);
	const [initialized, setInitialized] = useState(false);

	// Get enriched cart items to calculate accurate count and validate items
	const enrichedItems = useEnrichedCart(cart.items);

	// Load cart from cookie on initial render (client-side only)
	useEffect(() => {
		const savedCart = getCookie(CART_COOKIE_NAME);
		if (savedCart) {
			try {
				setCart(JSON.parse(String(savedCart)));
			} catch (error) {
				console.error("Failed to parse cart cookie:", error);
				// Reset the cart if the cookie is corrupted
				setCart({ items: [], lastUpdated: Date.now() });
			}
		}
		setInitialized(true);
	}, []);

	// Listen for cart clear events from other parts of the app (like order success page)
	useEffect(() => {
		const handleCartCleared = () => {
			setCart({
				items: [],
				lastUpdated: Date.now(),
			});
		};

		window.addEventListener("cart-cleared", handleCartCleared);
		return () => window.removeEventListener("cart-cleared", handleCartCleared);
	}, []);

	// Save cart to cookie whenever it changes
	useEffect(() => {
		if (initialized) {
			setCookie(CART_COOKIE_NAME, JSON.stringify(cart), {
				maxAge: 60 * 60 * 24 * 7, // 7 days
				path: "/",
			});
		}
	}, [cart, initialized]);

	// Clean up invalid/inactive items from cart
	// This ensures cart.items only contains valid, active products
	// Use a memoized set of valid item keys to avoid recreating it on every render
	const validItemKeysSet = useMemo(() => {
		return new Set(
			enrichedItems.map(
				(item) => `${item.productId}-${item.variationId ?? "none"}`,
			),
		);
	}, [enrichedItems]);

	useEffect(() => {
		if (!initialized) return;

		// Check if any cart items are invalid
		setCart((prevCart) => {
			const validItems = prevCart.items.filter((item) =>
				validItemKeysSet.has(`${item.productId}-${item.variationId ?? "none"}`),
			);

			// Only update if items were actually removed
			if (validItems.length !== prevCart.items.length) {
				return {
					items: validItems,
					lastUpdated: Date.now(),
				};
			}

			return prevCart;
		});
		// validItemKeysSet is memoized from enrichedItems, so depending on enrichedItems is sufficient
		// biome-ignore lint/correctness/useExhaustiveDependencies: validItemKeysSet is derived from enrichedItems
	}, [initialized, enrichedItems]);

	// Calculate itemCount from enriched items (only valid, active products)
	// This ensures the count matches what's actually displayed in the cart drawer
	const itemCount = useMemo(
		() => enrichedItems.reduce((count, item) => count + item.quantity, 0),
		[enrichedItems],
	);

	// Helper function to normalize variationId for consistent comparison
	// Ensures undefined and null are treated the same way
	const normalizeVariationId = (variationId?: number | null): number | undefined => {
		return variationId ?? undefined;
	};

	// Add item to cart (or update quantity if exists)
	// Validation happens BEFORE calling this function
	const addToCart = (item: CartItem) => {
		setCart((prevCart) => {
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
	};

	// Combined function to add a product to cart using client-side validation
	const addProductToCart = async (
		product: Product,
		quantity: number,
		selectedVariation?: ProductVariation | null,
		products?: ProductWithVariations[], // Products passed from component (optional - for validation)
	): Promise<boolean> => {
		try {
			// Basic validation
			if (!product || !product.id) {
				toast.error("Неверный товар");
				return false;
			}

			if (quantity <= 0) {
				toast.error("Неверное количество");
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
				const currentProductWithVariations =
					products?.find((p) => p.id === product.id) ||
					(product as ProductWithVariations);
				const variationExists = currentProductWithVariations.variations?.some(
					(v) => v.id === selectedVariation.id,
				);
				if (!variationExists) {
					toast.error("Выбранный вариант не найден");
					return false;
				}
			}

			// Try to find the product in products array for validation (if provided)
			// If products array is not provided or empty, use the product directly
			const currentProduct =
				products?.find((p) => p.id === product.id) || product;

			// Validate product is active
			if (!currentProduct.isActive) {
				toast.error("Этот товар больше недоступен");
				return false;
			}

			// Validate variation exists and matches (only if products array was provided)
			if (selectedVariation && products && products.length > 0) {
				const currentProductWithVariations =
					currentProduct as ProductWithVariations;
				const currentVariation = currentProductWithVariations.variations?.find(
					(v) => v.id === selectedVariation.id,
				);
				if (!currentVariation) {
					toast.error("Выбранный вариант не найден");
					return false;
				}
				// Validate variation price matches
				if (currentVariation.price !== selectedVariation.price) {
					toast.error("Цена товара изменилась");
					return false;
				}
			} else if (!selectedVariation && products && products.length > 0) {
				// Validate base product price matches (only if products array was provided)
				if (currentProduct.price !== product.price) {
					toast.error("Цена товара изменилась");
					return false;
				}
			}

			// Check if item already exists in cart to determine proper validation
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
	};

	// Remove item from cart
	const removeFromCart = (productId: number, variationId?: number) => {
		setCart((prevCart) => {
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
	};

	// Update item quantity
	// Validation happens BEFORE calling this function
	const updateQuantity = async (
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
		const normalizedVariationId = normalizeVariationId(variationId);
		setCart((prevCart) => ({
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
		}));
	};

	// Clear the cart
	const clearCart = () => {
		setCart({
			items: [],
			lastUpdated: Date.now(),
		});
	};

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
				isLoading: !initialized,
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
