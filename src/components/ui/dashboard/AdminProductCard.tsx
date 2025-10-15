import { Edit, Trash2 } from "lucide-react";
import { Badge } from "~/components/ui/shared/Badge";
import { getCountryFlag } from "~/constants/countries";
import { cn } from "~/lib/utils";
import type { ProductWithVariations } from "~/types";
import { getStockDisplayText, isProductAvailable } from "~/utils/validateStock";
import styles from "../store/productCard.module.css";

interface AdminProductCardProps {
	product: ProductWithVariations;
	onEdit: (product: ProductWithVariations) => void;
	onDelete: (product: ProductWithVariations) => void;
	formatPrice: (price: number) => string;
	getTeaCategoryNames: (slugs: string[] | undefined) => string;
}

export function AdminProductCard({
	product,
	onEdit,
	onDelete,
	formatPrice: _formatPrice,
}: AdminProductCardProps) {
	const imageArray = product.images?.split(",").map((img) => img.trim()) ?? [];
	const primaryImage = imageArray[0];
	const hasAnyStock = isProductAvailable(product);
	const stockDisplayText = getStockDisplayText(product);

	// Calculate the display price - use highest variation price if variations exist, otherwise base price
	const displayPrice = (() => {
		if (
			product.hasVariations &&
			product.variations &&
			product.variations.length > 0
		) {
			const prices = product.variations.map((v) => v.price);
			return Math.max(...prices);
		}
		return product.price;
	})();

	// Get all shipping locations (product + variations)
	const getAllShippingLocations = () => {
		const locations = new Set<string>();

		// Add product-level shipping if available
		if (product.shippingFrom) {
			locations.add(product.shippingFrom);
		}

		// Add variation-level shipping if available
		if (
			product.hasVariations &&
			product.variations &&
			product.variations.length > 0
		) {
			product.variations.forEach((variation) => {
				if (variation.shippingFrom) {
					locations.add(variation.shippingFrom);
				}
			});
		}

		return Array.from(locations);
	};

	const allShippingLocations = getAllShippingLocations();

	return (
		<div className="block h-full relative">
			<div
				className="w-full product-card overflow-hidden group"
				id={styles.productCard}
			>
				<div className="bg-background flex flex-col">
					{/* Image Section */}
					<div className="relative aspect-square overflow-hidden">
						<div>
							{/* Primary Image */}
							<div className="relative aspect-square flex items-center justify-center overflow-hidden">
								{primaryImage ? (
									<div className="relative w-full h-full">
										{/* Primary Image */}
										<img
											src={`https://assets.rublevsky.studio/${primaryImage}`}
											alt={product.name}
											loading="eager"
											className="absolute inset-0 w-full h-full object-cover object-center"
											style={{
												filter: !hasAnyStock ? "grayscale(100%)" : "none",
												opacity: !hasAnyStock ? 0.6 : 1,
											}}
										/>
										{/* Secondary Image (if exists) - Only on desktop devices with hover capability */}
										{imageArray.length > 1 && (
											<img
												src={`https://assets.rublevsky.studio/${imageArray[1]}`}
												alt={product.name}
												loading="eager"
												className="absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-500 ease-in-out opacity-0 group-hover:opacity-100 hidden md:block"
												style={{
													filter: !hasAnyStock ? "grayscale(100%)" : "none",
												}}
											/>
										)}
									</div>
								) : (
									<div className="absolute inset-0 bg-muted flex items-center justify-center">
										<span className="text-muted-foreground">No image</span>
									</div>
								)}
							</div>
						</div>

						{/* Featured Badge */}
						{product.isFeatured && (
							<div className="absolute top-2 right-2">
								<Badge variant="default">Featured</Badge>
							</div>
						)}

						{/* Desktop Action Buttons */}
						<div className="absolute bottom-0 left-0 right-0 hidden md:flex opacity-0 group-hover:opacity-100 transition-all duration-500">
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									onEdit(product);
								}}
								className="flex-1 flex items-center justify-center space-x-2 bg-muted/70 backdrop-blur-xs text-foreground hover:bg-primary hover:text-primary-foreground active:bg-primary active:text-primary-foreground transition-all duration-500 py-2 cursor-pointer outline-none border-none"
								style={{ margin: 0, padding: "0.5rem 0" }}
							>
								<Edit className="w-4 h-4" />
								<span>Edit</span>
							</button>
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									onDelete(product);
								}}
								className="w-12 flex items-center justify-center bg-muted/70 backdrop-blur-xs text-foreground hover:bg-red-600 hover:text-primary-foreground active:bg-red-600 active:text-primary-foreground transition-all duration-500 cursor-pointer outline-none border-none"
								style={{ margin: 0, padding: "0.5rem 0" }}
							>
								<Trash2 className="w-4 h-4" />
							</button>
						</div>
					</div>

					{/* Content Section */}
					<div className="flex flex-col h-auto md:h-full">
						{/* Info Section */}
						<div className="p-4 flex flex-col h-auto md:h-full">
							{/* Price */}
							<div className="flex flex-col mb-2">
								<div className="flex flex-wrap items-center justify-between w-full gap-x-2">
									<div className="flex flex-col items-baseline gap-1">
										{product.discount ? (
											<>
												<h5 className="whitespace-nowrap">
													$
													{(
														displayPrice *
														(1 - product.discount / 100)
													).toFixed(2)}{" "}
													CAD
												</h5>
												<div className="flex items-center gap-1">
													<h6 className="line-through text-muted-foreground">
														${displayPrice.toFixed(2)}
													</h6>
													<Badge variant="green">{product.discount}% OFF</Badge>
												</div>
											</>
										) : (
											<h5 className="whitespace-nowrap">
												${displayPrice.toFixed(2)} CAD
											</h5>
										)}
									</div>
									{/* Tea Category Badges - Desktop/Tablet */}
									<div className="hidden md:flex flex-col gap-1 items-end justify-center">
										{product.teaCategories?.map((category) => (
											<Badge key={category.slug} teaCategory={category} />
										))}
									</div>
								</div>
								{/* Tea Category Badges - Mobile */}
								<div className="md:hidden mt-2 flex flex-wrap gap-2">
									{product.teaCategories?.map((category) => (
										<Badge key={category.slug} teaCategory={category} />
									))}
								</div>
							</div>

							{/* Product Name */}
							<p className="mb-3">{product.name}</p>

							{/* Metadata */}
							<div className="space-y-1 text-sm">
								{/* Stock */}
								<div>
									<span
										className={cn(
											"text-xs",
											hasAnyStock ? "text-muted-foreground" : "text-red-600",
										)}
									>
										Stock: {stockDisplayText}
									</span>
								</div>

								{/* Weight */}
								{product.weight && (
									<div>
										<span className="text-muted-foreground text-xs">
											Weight: {product.weight}g
										</span>
									</div>
								)}

								{/* Shipping */}
								{allShippingLocations.filter(
									(code) => code !== "" && code !== "NONE",
								).length > 0 && (
									<div>
										<span className="text-muted-foreground text-xs">
											Ships from:{" "}
											{allShippingLocations
												.filter((code) => code !== "" && code !== "NONE")
												.map(
													(countryCode) =>
														getCountryFlag(countryCode) || countryCode,
												)
												.join(" ")}
										</span>
									</div>
								)}
							</div>
						</div>

						{/* Mobile Action Buttons */}
						<div className="md:hidden mt-auto flex">
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									onEdit(product);
								}}
								className="flex-1 cursor-pointer flex items-center justify-center space-x-2 bg-muted backdrop-blur-xs text-foreground hover:bg-primary hover:text-primary-foreground active:bg-primary active:text-primary-foreground transition-all duration-500 py-2 px-4 outline-none border-none"
								style={{ margin: 0 }}
							>
								<Edit className="w-4 h-4" />
								<span>Edit</span>
							</button>
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									onDelete(product);
								}}
								className="w-12 cursor-pointer flex items-center justify-center bg-muted backdrop-blur-xs text-foreground hover:bg-red-600 hover:text-primary-foreground active:bg-red-600 active:text-primary-foreground transition-all duration-500 outline-none border-none"
								style={{ margin: 0, padding: "0.5rem 0" }}
							>
								<Trash2 className="w-4 h-4" />
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
