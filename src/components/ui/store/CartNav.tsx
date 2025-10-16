import {
	Drawer,
	DrawerContent,
	DrawerTrigger,
} from "~/components/ui/shared/Drawer";
import { useCart } from "~/lib/cartContext";
import { CartDrawerContent } from "./CartDrawerContent";
import { CartNavSkeleton } from "./skeletons/CartNavSkeleton";

export function CartNav() {
	const { cartOpen, setCartOpen, itemCount, isLoading } = useCart();

	// Show skeleton while loading
	if (isLoading) {
		return <CartNavSkeleton />;
	}

	return (
		<div className="fixed bottom-3 right-3 z-50">
			<Drawer open={cartOpen} onOpenChange={setCartOpen}>
				<DrawerTrigger asChild>
					<button
						type="button"
						onClick={() => setCartOpen(true)}
						className="relative flex items-center justify-center w-[2.6rem] h-[2.6rem] md:w-[3.2rem] md:h-[3.2rem] rounded-full border border-black bg-background hover:bg-primary hover:text-primary-foreground active:bg-primary active:text-primary-foreground transition-all duration-500"
					>
						{/* Cart SVG Icon */}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="w-5 h-5 md:w-6 md:h-6"
							fill="none"
							viewBox="0 0 33 30"
							aria-label="Корзина"
							role="img"
						>
							<title>Корзина</title>
							<path
								d="M1.94531 1.80127H7.27113L11.9244 18.602C12.2844 19.9016 13.4671 20.8013 14.8156 20.8013H25.6376C26.9423 20.8013 28.0974 19.958 28.495 18.7154L31.9453 7.9303H19.0041"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
							<circle cx="13.4453" cy="27.3013" r="2.5" fill="currentColor" />
							<circle cx="26.4453" cy="27.3013" r="2.5" fill="currentColor" />
						</svg>

						{/* Cart Counter Badge */}
						{itemCount > 0 && (
							<span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-sm w-3.5 h-3.5 md:w-5 md:h-5 flex items-center justify-center rounded-full">
								{itemCount}
							</span>
						)}
					</button>
				</DrawerTrigger>
				<DrawerContent>
					<CartDrawerContent />
				</DrawerContent>
			</Drawer>
		</div>
	);
}
