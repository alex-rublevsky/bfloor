import {
	DrawerBody,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from "~/components/ui/shared/Drawer";
import { useCart } from "~/lib/cartContext";
import { ShoppingBag } from "../shared/Icon";
import { CartItem } from "./CartItem";
import { CartCheckoutButton, CartSummary } from "./CartSummary";

export function CartDrawerContent() {
	const { enrichedItems } = useCart();

	return (
		<>
			<DrawerHeader>
				<DrawerTitle>Корзина</DrawerTitle>
				<DrawerDescription>
					Просмотрите и управляйте товарами в корзине
				</DrawerDescription>
			</DrawerHeader>

			<DrawerBody>
				{enrichedItems.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-full">
						<ShoppingBag size={48} className="text-muted mb-4" />
						<p className="text-muted-foreground">Ваша корзина пуста</p>
					</div>
				) : (
					<div className="space-y-6">
						<div className="space-y-4">
							{enrichedItems.map((item) => (
								<CartItem
									key={`${item.productId}-${item.variationId || "default"}`}
									item={item}
								/>
							))}
						</div>
						<CartSummary />
					</div>
				)}
			</DrawerBody>

			{enrichedItems.length > 0 && (
				<DrawerFooter>
					<CartCheckoutButton />
				</DrawerFooter>
			)}
		</>
	);
}
