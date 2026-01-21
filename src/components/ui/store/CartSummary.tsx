import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "~/components/ui/shared/Button";
import { useCartTotals } from "~/hooks/useCartTotals";
import { useCart } from "~/lib/cartContext";
import { Badge } from "../shared/Badge";

export function CartSummary() {
	const { enrichedItems } = useCart();
	const { subtotal, discountTotal, total } = useCartTotals(enrichedItems);

	return (
		<div className="space-y-2 pb-0">
			<div className="flex justify-between text-sm">
				<p>Промежуточный итог</p>
				<p>{subtotal.toFixed(2)} р</p>
			</div>

			{discountTotal > 0 && (
				<div className="flex justify-between text-sm text-foreground">
					<p>Скидка</p>
					<Badge variant="green" className="text-sm translate-x-2">
						-{discountTotal.toFixed(2)} р
					</Badge>
				</div>
			)}

			<div className="flex justify-between">
				<span>Итого</span>
				<h4>{total.toFixed(2)} р</h4>
			</div>

			<p className="text-xs text-muted-foreground text-center pt-2">
				Доставка будет рассчитана при оформлении заказа
			</p>
		</div>
	);
}

export function CartCheckoutButton() {
	const { cart, setCartOpen, enrichedItems } = useCart();
	const { total } = useCartTotals(enrichedItems);
	const [isLoading, setIsLoading] = useState(false);
	const navigate = useNavigate();

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
			{isLoading ? "Обработка..." : `Оформить заказ ${total.toFixed(2)} р`}
		</Button>
	);
}
