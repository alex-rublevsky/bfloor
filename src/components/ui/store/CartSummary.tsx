import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "~/components/ui/shared/Button";
import { useEnrichedCart } from "~/hooks/useEnrichedCart";
import { useCart } from "~/lib/cartContext";
import { Badge } from "../shared/Badge";

export function CartSummary() {
	const { cart } = useCart();
	const enrichedItems = useEnrichedCart(cart.items);

	// Calculate cart totals with discounts
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

	return (
		<div className="space-y-2 pb-0">
			<div className="flex justify-between text-sm">
				<p>Subtotal</p>
				<p>${subtotal.toFixed(2)}</p>
			</div>

			{discountTotal > 0 && (
				<div className="flex justify-between text-sm text-foreground">
					<p>Discount</p>
					<Badge variant="green" className="text-sm translate-x-2">
						-${discountTotal.toFixed(2)}
					</Badge>
				</div>
			)}

			<div className="flex justify-between">
				<span>Total</span>
				<h4>${total.toFixed(2)}</h4>
			</div>

			<p className="text-xs text-muted-foreground text-center pt-2">
				Shipping will be calculated at checkout
			</p>
		</div>
	);
}

export function CartCheckoutButton() {
	const { cart, setCartOpen } = useCart();
	const enrichedItems = useEnrichedCart(cart.items);
	const [isLoading, setIsLoading] = useState(false);
	const navigate = useNavigate();

	// Calculate total with discounts
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

	const handleCheckout = async () => {
		if (cart.items.length === 0) return;

		setIsLoading(true);

		try {
			// Close the cart drawer
			setCartOpen(false);

			// Redirect to checkout page
			navigate({ to: "/store/checkout" });
		} catch (error) {
			console.error("Checkout error:", error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Button
			onClick={handleCheckout}
			disabled={cart.items.length === 0 || isLoading}
			className="w-full"
		>
			{isLoading ? "Processing..." : `Checkout $${total.toFixed(2)}`}
		</Button>
	);
}
