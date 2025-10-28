import { X } from "lucide-react";
import { Badge } from "~/components/ui/shared/Badge";
import { Image } from "~/components/ui/shared/Image";
import { Link } from "~/components/ui/shared/Link";
import { QuantitySelector } from "~/components/ui/shared/QuantitySelector";
import { ASSETS_BASE_URL } from "~/constants/urls";
import type { EnrichedCartItem } from "~/hooks/useEnrichedCart";
import {
	getAttributeDisplayName,
	useProductAttributes,
} from "~/hooks/useProductAttributes";
import { useCart } from "~/lib/cartContext";

interface CartItemProps {
	item: EnrichedCartItem;
	enrichedItems: EnrichedCartItem[];
}

export function CartItem({ item }: CartItemProps) {
	const { updateQuantity, removeFromCart } = useCart();
	const { data: attributes } = useProductAttributes();

	const handleIncrement = () => {
		updateQuantity(
			item.productId,
			item.quantity + 1,
			item.variationId,
		);
	};

	const handleDecrement = () => {
		if (item.quantity > 1) {
			updateQuantity(
				item.productId,
				item.quantity - 1,
				item.variationId,
			);
		}
	};

	return (
		<div className="flex items-start gap-4 py-4">
			{/* Product image with overlapping remove button */}
			<div className="shrink-0 relative w-20">
				<div className="w-full bg-muted rounded-md overflow-hidden">
					{item.image ? (
						<Image
							src={`${ASSETS_BASE_URL}/${item.image}`}
							alt={item.productName}
							width={80}
							height={80}
							className="w-full h-auto object-contain"
						/>
					) : (
						<div className="aspect-square w-full h-full flex items-center justify-center text-muted-foreground">
							No image
						</div>
					)}
				</div>
				<button
					type="button"
					onClick={() => removeFromCart(item.productId, item.variationId)}
					className="absolute translate-x-1/2 translate-y-1/2 bottom-0 right-0 p-1 bg-background/80 hover:bg-background/80 active:bg-background/80 backdrop-blur-[2px] rounded-md shadow-sm text-secondary-foreground hover:text-foreground active:text-foreground cursor-pointer transition-colors"
					aria-label="Удалить из корзины"
				>
					<X size={16} />
				</button>
			</div>

			{/* Product info */}
			<div className="grow">
				<Link href={`/product/${item.productSlug}`} className="hover:underline">
					{item.productName}
				</Link>

				{item.attributes && Object.entries(item.attributes).length > 0 && (
					<div className="flex flex-wrap gap-x-6 gap-y-0 mt-1">
						{Object.entries(item.attributes).map(([key, value]) => (
							<span key={key} className="text-sm text-muted-foreground">
								{getAttributeDisplayName(key, attributes || [])}: {value}
							</span>
						))}
					</div>
				)}

				<div className="mt-2">
					<QuantitySelector
						quantity={item.quantity}
						onIncrement={handleIncrement}
						onDecrement={handleDecrement}
						maxQuantity={effectiveMaxQuantity}
						size="compact"
					/>
				</div>
			</div>

			{/* Price column */}
			<div className="flex flex-col items-end">
				{item.discount ? (
					<div className="flex flex-col items-end">
						<Badge variant="greenOutline" className="translate-x-2">
							{item.discount}% OFF
						</Badge>
						<span className="line-through text-sm text-muted-foreground">
							${(item.price * item.quantity).toFixed(2)}
						</span>
						<h6>
							$
							{(item.price * (1 - item.discount / 100) * item.quantity).toFixed(
								2,
							)}
						</h6>
					</div>
				) : (
					<h6>${(item.price * item.quantity).toFixed(2)}</h6>
				)}
			</div>
		</div>
	);
}
