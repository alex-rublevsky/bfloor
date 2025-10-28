import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { ASSETS_BASE_URL } from "~/constants/urls";
import { usePrefetch } from "~/hooks/usePrefetch";
import {
	getAttributeDisplayName,
	useProductAttributes,
} from "~/hooks/useProductAttributes";
import { useVariationSelection } from "~/hooks/useVariationSelection";
import { useCart } from "~/lib/cartContext";
import { storeDataQueryOptions } from "~/lib/queryOptions";
import type {
	CartItem,
	Product,
	ProductVariation,
	VariationAttribute,
} from "~/types";
import { FilterGroup } from "../shared/FilterGroup";
import styles from "./productCard.module.css";

// Extended product interface with variations
interface ProductWithVariations extends Product {
	variations?: ProductVariationWithAttributes[];
}

interface ProductVariationWithAttributes extends ProductVariation {
	attributes: VariationAttribute[];
}

// Memoize expensive calculations outside component
const calculateImageArray = (images: string | null): string[] => {
	if (!images) return [];
	try {
		return JSON.parse(images) as string[];
	} catch {
		// Fallback to comma-separated parsing for backward compatibility
		return images
			.split(",")
			.map((img) => img.trim())
			.filter(Boolean);
	}
};

const calculateUniqueAttributeValues = (
	variations: ProductVariationWithAttributes[] | undefined,
	attributeId: string,
): string[] => {
	if (!variations) return [];

	const sortedVariations = [...variations].sort(
		(a, b) => (b.sort ?? 0) - (a.sort ?? 0),
	);

	const values = new Set<string>();
	sortedVariations.forEach((variation) => {
		const attribute = variation.attributes.find(
			(attr) => attr.attributeId === attributeId,
		);
		if (attribute) {
			values.add(attribute.value);
		}
	});

	return Array.from(values);
};

const calculateAttributeNames = (
	variations: ProductVariationWithAttributes[] | undefined,
): string[] => {
	if (!variations) return [];

	const attributeNames = new Set<string>();
	variations.forEach((variation) => {
		variation.attributes.forEach((attr: VariationAttribute) => {
			attributeNames.add(attr.attributeId);
		});
	});

	return Array.from(attributeNames);
};

// Helper function to get default variation for a product
const getDefaultVariation = (
	product: ProductWithVariations,
): ProductVariationWithAttributes | null => {
	if (!product?.variations || !product.hasVariations) return null;

	// Find the first variation by sort order
	const sortedVariations = [...product.variations].sort((a, b) => {
		return (b.sort ?? 0) - (a.sort ?? 0);
	});

	return sortedVariations[0] || null;
};

// Helper function to convert variation attributes to URL search params
const getVariationSearchParams = (
	variation: ProductVariationWithAttributes | null,
): Record<string, string> => {
	if (!variation) return {};

	const params: Record<string, string> = {};
	variation.attributes.forEach((attr: VariationAttribute) => {
		const paramName = attr.attributeId.toLowerCase();
		params[paramName] = attr.value;
	});

	return params;
};

function ProductCard({ product }: { product: ProductWithVariations }) {
	const [isAddingToCart, setIsAddingToCart] = useState(false);
	const { addProductToCart, cart } = useCart();
	const { prefetchProduct } = usePrefetch();
	const queryClient = useQueryClient();
	const { data: attributes } = useProductAttributes();

	// Use the variation selection hook
	const {
		selectedVariation,
		selectedAttributes,
		selectVariation,
		isAttributeValueAvailable,
	} = useVariationSelection({
		product,
		cartItems: cart.items,
	});

	// Calculate default variation and search params for the Link
	const defaultVariation = useMemo(
		() => getDefaultVariation(product),
		[product],
	);

	const linkSearchParams = useMemo(
		() => getVariationSearchParams(defaultVariation),
		[defaultVariation],
	);

	// Memoize expensive calculations
	const imageArray = useMemo(
		() => calculateImageArray(product.images),
		[product.images],
	);

	// Get unique attribute values for a specific attribute ID - memoized
	const getUniqueAttributeValues = useCallback(
		(attributeId: string): string[] => {
			return calculateUniqueAttributeValues(product.variations, attributeId);
		},
		[product.variations],
	);

	// Calculate if the product is available to add to cart
	const isAvailable = useMemo(() => {
		return product.isActive;
	}, [product.isActive]);

	// Calculate current price based on selected variation
	const currentPrice = useMemo(() => {
		// If product has variations, always use variation price
		if (product.hasVariations) {
			return selectedVariation?.price || 0;
		}
		// If product price is zero, use variation price (if available)
		if (product.price === 0 && selectedVariation) {
			return selectedVariation.price;
		}
		return selectedVariation ? selectedVariation.price : product.price;
	}, [selectedVariation, product.price, product.hasVariations]);

	// Get attribute names to display in the card - memoized
	const attributeNames = useMemo(
		() => calculateAttributeNames(product.variations),
		[product.variations],
	);

	const handleAddToCart = useCallback(
		async (e: React.MouseEvent) => {
			e.preventDefault();
			if (!isAvailable) return;

			setIsAddingToCart(true);

			try {
				// Get products from TanStack Query cache for validation
				const storeData = queryClient.getQueryData(
					storeDataQueryOptions().queryKey,
				);
				const products = storeData?.products || [];

				// Use the context function directly
				await addProductToCart(
					product as Product,
					1, // Default quantity of 1 when adding from product card
					selectedVariation,
					selectedAttributes,
					products as unknown as ProductWithVariations[],
				);
			} catch (error) {
				console.error("Error adding to cart:", error);
			} finally {
				setIsAddingToCart(false);
			}
		},
		[
			isAvailable,
			addProductToCart,
			product,
			selectedVariation,
			selectedAttributes,
			queryClient,
		],
	);

	// Check if product is coming soon (not in the type, so we'll use a placeholder)
	const isComingSoon = false; // Replace with actual logic when available

	return (
		<Link
			to="/store/$productId"
			params={{
				productId: product.slug,
			}}
			search={linkSearchParams}
			className="block h-full relative"
			preload="intent"
			viewTransition={true}
			onMouseEnter={() => prefetchProduct(product.slug)}
		>
			<div
				className="w-full product-card overflow-hidden  group"
				id={styles.productCard}
			>
				<div className="bg-background flex flex-col">
					<div className="relative aspect-square overflow-hidden">
						<div>
							{/* Primary Image */}
							<div className="relative aspect-square flex items-center justify-center overflow-hidden">
								{imageArray.length > 0 ? (
									<div className="relative w-full h-full">
										{/* Primary Image */}
										<img
											src={`${ASSETS_BASE_URL}/${imageArray[0]}`}
											alt={product.name}
											loading="eager"
											className="absolute inset-0 w-full h-full object-cover object-center"
											//TODO: update with srcset?
											//sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
											style={{
												viewTransitionName: `product-image-${product.slug}`,
											}}
										/>
										{/* Secondary Image (if exists) - Only on desktop devices with hover capability */}
										{imageArray.length > 1 && (
											<img
												src={`${ASSETS_BASE_URL}/${imageArray[1]}`}
												alt={product.name}
												loading="eager"
												className="absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-500 ease-in-out opacity-0 group-hover:opacity-100 hidden md:block"
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

						{/* Desktop Add to Cart button */}
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								handleAddToCart(e);
							}}
							className={`absolute bottom-0 left-0 right-0 hidden md:flex items-center justify-center space-x-2 bg-muted/70 backdrop-blur-xs text-foreground hover:bg-primary active:bg-primary transition-all duration-500 py-2 opacity-0 group-hover:opacity-100 ${
								!isAvailable
									? "cursor-not-allowed hover:bg-muted/70 active:bg-muted/70 opacity-50"
									: "cursor-pointer hover:text-primary-foreground active:text-primary-foreground"
							}`}
							disabled={!isAvailable}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								fill="none"
								viewBox="0 0 33 30"
								className="cart-icon"
							>
								<title>Add to cart</title>
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
							{!isAddingToCart ? (
								<span>
									{isComingSoon ? "Pre-order" : "Add to Cart"}
								</span>
							) : (
								<span>{isComingSoon ? "Pre-ordering..." : "Adding..."}</span>
							)}
						</button>
					</div>

					{/* Content Section */}
					<div className="flex flex-col h-auto md:h-full">
						{/* Info Section */}
						<div className="p-4 flex flex-col h-auto md:h-full">
							{/* Price */}
							<div className="flex flex-col mb-2">
								<div className="flex flex-wrap items-center w-full gap-2">
									<div className="flex flex-col items-baseline gap-0 flex-shrink-0">
										{product.discount ? (
											<>
												<div className="whitespace-nowrap flex items-baseline gap-0.5">
													<span className="text-xl font-light">
														{(
															currentPrice *
															(1 - product.discount / 100)
														).toFixed(2)}
													</span>
													<span className="text-xs  font-light text-muted-foreground">
														р
													</span>
												</div>
												<div className="flex items-center gap-1">
													<span className="text-sm line-through text-muted-foreground">
														{currentPrice?.toFixed(2)}
													</span>
													<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
														-{product.discount}%
													</span>
												</div>
											</>
										) : (
											<div
												className="whitespace-nowrap flex items-baseline gap-0.5"
												style={{
													viewTransitionName: `product-price-${product.slug}`,
												}}
											>
												<span className="text-xl font-light">
													{currentPrice?.toFixed(2)}
												</span>
												<span className="text-xs font-light text-muted-foreground">
													р
												</span>
											</div>
										)}
									</div>

									{isComingSoon && (
										<>
											<span className="text-sm hidden sm:inline">
												Coming Soon
											</span>
											<span className="text-sm w-full block sm:hidden mt-1">
												Coming Soon
											</span>
										</>
									)}
								</div>

								{/* Product Name */}
								<p
									className=" mb-3"
									style={{
										viewTransitionName: `product-name-${product.slug}`,
									}}
								>
									{product.name}
								</p>

								{/* Variations */}
								{product.hasVariations &&
									product.variations &&
									product.variations.length > 0 && (
										<div className="space-y-2">
											{attributeNames.map((attributeId: string) => (
												<FilterGroup
													key={attributeId}
													title={getAttributeDisplayName(
														attributeId,
														attributes || [],
													)}
													options={getUniqueAttributeValues(attributeId)}
													selectedOptions={
														selectedAttributes[attributeId] || null
													}
													onOptionChange={(value) => {
														if (value) {
															selectVariation(attributeId, value);
														}
													}}
													showAllOption={false}
													variant="product"
													getOptionAvailability={(value) =>
														isAttributeValueAvailable(attributeId, value)
													}
												/>
											))}
										</div>
									)}
							</div>

							{/* Mobile Add to Cart button */}
							<div className="md:hidden mt-auto">
								<button
									type="button"
									onClick={(e) => {
										e.stopPropagation();
										handleAddToCart(e);
									}}
									className={`w-full cursor-pointer flex items-center justify-center space-x-2 bg-muted backdrop-blur-xs text-foreground hover:bg-primary active:bg-primary transition-all duration-500 py-2 px-4 ${
										!isAvailable
											? "opacity-50 cursor-not-allowed hover:bg-muted/70 hover:text-foreground active:bg-muted/70 active:text-foreground"
											: "hover:text-primary-foreground active:text-primary-foreground"
									}`}
									disabled={!isAvailable}
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="16"
										height="16"
										fill="none"
										viewBox="0 0 33 30"
										className="cart-icon"
										aria-label="Добавить в корзину"
									>
										<title>Add to cart</title>
										<path
											d="M1.94531 1.80127H7.27113L11.9244 18.602C12.2844 19.9016 13.4671 20.8013 14.8156 20.8013H25.6376C26.9423 20.8013 28.0974 19.958 28.495 18.7154L31.9453 7.9303H19.0041"
											stroke="currentColor"
											strokeWidth="2"
											strokeLinecap="round"
											strokeLinejoin="round"
										/>
										<circle
											cx="13.4453"
											cy="27.3013"
											r="2.5"
											fill="currentColor"
										/>
										<circle
											cx="26.4453"
											cy="27.3013"
											r="2.5"
											fill="currentColor"
										/>
									</svg>
									{!isAddingToCart ? (
										<span>
											{isComingSoon ? "Pre-order" : "Add to Cart"}
										</span>
									) : (
										<span>
											{isComingSoon ? "Pre-ordering..." : "Adding..."}
										</span>
									)}
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</Link>
	);
}

export default ProductCard;
