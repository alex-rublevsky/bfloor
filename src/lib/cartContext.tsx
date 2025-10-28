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
import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { getCookie, setCookie } from "~/lib/cookies";
import type { Product, ProductVariation, ProductWithVariations } from "~/types";

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
		selectedAttributes?: Record<string, string>,
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
const CART_COOKIE_NAME = "rublevsky-cart";

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

	const itemCount = cart.items.reduce(
		(count, item) => count + item.quantity,
		0,
	);

	// Add item to cart (or update quantity if exists)
	// Validation happens BEFORE calling this function
	const addToCart = (item: CartItem) => {
		setCart((prevCart) => {
			const existingIndex = prevCart.items.findIndex(
				(cartItem) =>
					cartItem.productId === item.productId &&
					cartItem.variationId === item.variationId,
			);

			let newItems: CartItem[];

			if (existingIndex >= 0) {
				// Update existing item quantity
				newItems = [...prevCart.items];
				newItems[existingIndex] = {
					...newItems[existingIndex],
					quantity: newItems[existingIndex].quantity + item.quantity,
				};
			} else {
				// Add new item
				newItems = [...prevCart.items, item];
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
		_selectedAttributes?: Record<string, string>, // Not used anymore (enriched from cache)
		products?: ProductWithVariations[], // Products passed from component
	): Promise<boolean> => {
		try {
			// Basic validation
			if (!product || !product.id) {
				toast.error("Invalid product");
				return false;
			}

			if (quantity <= 0) {
				toast.error("Invalid quantity");
				return false;
			}

			// Validate variation requirement
			if (product.hasVariations && !selectedVariation) {
				toast.error("Please select a variation");
				return false;
			}

			if (!product.hasVariations && selectedVariation) {
				toast.error("This product does not support variations");
				return false;
			}

			// Find the product in products array to get the latest data
			const currentProduct = products?.find((p) => p.id === product.id);
			if (!currentProduct) {
				toast.error("Product not found");
				return false;
			}

			// Validate variation exists and matches
			if (selectedVariation) {
				const currentVariation = currentProduct.variations?.find(
					(v) => v.id === selectedVariation.id,
				);
				if (!currentVariation) {
					toast.error("Selected variation not found");
					return false;
				}
				// Validate variation price matches
				if (currentVariation.price !== selectedVariation.price) {
					toast.error("Product price has changed");
					return false;
				}
			} else {
				// Validate base product price matches
				if (currentProduct.price !== product.price) {
					toast.error("Product price has changed");
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
			return true;
		} catch (error) {
			console.error("Error adding product to cart:", error);
			toast.error("Failed to add product to cart");
			return false;
		}
	};

	// Remove item from cart
	const removeFromCart = (productId: number, variationId?: number) => {
		setCart((prevCart) => {
			const newItems = prevCart.items.filter(
				(item) =>
					!(item.productId === productId && item.variationId === variationId),
			);

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
		setCart((prevCart) => ({
			items: prevCart.items.map((item) =>
				item.productId === productId && item.variationId === variationId
					? { ...item, quantity: Math.max(1, quantity) }
					: item,
			),
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
