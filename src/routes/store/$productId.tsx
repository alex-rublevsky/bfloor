import { useQuery } from "@tanstack/react-query";
import type { ErrorComponentProps } from "@tanstack/react-router";
import {
	createFileRoute,
	Link,
	stripSearchParams,
} from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "~/components/ui/dashboard/breadcrumb";
import { Button } from "~/components/ui/shared/Button";
import { Icon } from "~/components/ui/shared/Icon";
import ImageGallery from "~/components/ui/shared/ImageGallery";
import { Input } from "~/components/ui/shared/input";
import {
	markdownComponents,
	rehypePlugins,
} from "~/components/ui/shared/MarkdownComponents";
import ProductSlider from "~/components/ui/shared/ProductSlider";
import { ProductPageSkeleton } from "~/components/ui/store/skeletons/ProductPageSkeleton";
import { VariationSelector } from "~/components/ui/store/VariationSelector";
import { ASSETS_BASE_URL } from "~/constants/urls";
import { useProductAttributes } from "~/hooks/useProductAttributes";
import { useRecentlyVisitedProducts } from "~/hooks/useRecentlyVisitedProducts";
import { useVariationSelection } from "~/hooks/useVariationSelection";
import { useCart } from "~/lib/cartContext";
import { productQueryOptions, userDataQueryOptions } from "~/lib/queryOptions";
import type {
	Product,
	ProductWithDetails,
	ProductWithVariations,
	VariationAttribute,
} from "~/types";
import { seo } from "~/utils/seo";

// Simple search params - no Zod needed for basic optional strings
const validateSearch = (search: Record<string, unknown>) => {
	// For now, we'll accept any string parameters as potential attributes
	// The actual validation will happen in the component using database attributes
	const result: Record<string, string | undefined> = {};

	Object.entries(search).forEach(([key, value]) => {
		if (typeof value === "string") {
			result[key] = value;
		}
	});

	return result;
};

// Error component for product page errors
function ProductErrorComponent({ error }: ErrorComponentProps) {
	return (
		<div className="min-h-screen flex items-center justify-center px-4">
			<div className="text-center max-w-md">
				<h1 className="text-4xl font-bold mb-4">Oops!</h1>
				<p className="text-muted-foreground mb-6">
					Something went wrong while loading this product.
				</p>
				<div className="flex gap-3 justify-center">
					<Button asChild size="lg">
						<Link to="/store">Browse Store</Link>
					</Button>
					<Button
						variant="outline"
						size="lg"
						onClick={() => window.location.reload()}
					>
						Try Again
					</Button>
				</div>
				{error && (
					<details className="mt-6 text-left">
						<summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
							Error details
						</summary>
						<pre className="mt-2 text-xs bg-muted p-4 rounded overflow-auto">
							{error.message}
						</pre>
					</details>
				)}
			</div>
		</div>
	);
}

// Not found component for product page
function ProductNotFoundComponent() {
	return (
		<div className="min-h-screen flex items-center justify-center px-4">
			<div className="text-center max-w-md">
				<h1 className="text-4xl font-bold mb-4">Product Not Found</h1>
				<p className="text-muted-foreground mb-6">
					The product you're looking for doesn't exist or has been removed.
				</p>
				<div className="flex gap-3 justify-center">
					<Button asChild size="lg">
						<Link to="/store">Browse Store</Link>
					</Button>
					<Button
						variant="outline"
						size="lg"
						onClick={() => window.history.back()}
					>
						Go Back
					</Button>
				</div>
			</div>
		</div>
	);
}

export const Route = createFileRoute("/store/$productId")({
	component: ProductPage,
	errorComponent: ProductErrorComponent,
	notFoundComponent: ProductNotFoundComponent,
	pendingComponent: ProductPageSkeleton,

	head: () => ({
		meta: [
			...seo({
				title: "Product - Rublevsky Studio",
				description: "Discover premium products at Rublevsky Studio store.",
			}),
		],
	}),

	validateSearch,
	// Strip undefined values from URL to keep it clean
	search: {
		middlewares: [stripSearchParams({})],
	},
});

function ProductPage() {
	const { productId } = Route.useParams();
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	const [quantity, setQuantity] = useState(1);

	const { addProductToCart, cart } = useCart();
	const { data: attributes } = useProductAttributes();
	const {
		addRecentlyVisited,
		getRecentlyVisitedProductIds,
		hasRecentlyVisited,
	} = useRecentlyVisitedProducts();

	// Check if user is admin
	const { data: userData } = useQuery(userDataQueryOptions());
	const isAdmin = userData?.isAdmin ?? false;

	// Use query to track loading state
	const {
		data: product,
		isLoading: isLoadingProduct,
		isFetching: isFetchingProduct,
	} = useQuery({
		...productQueryOptions(productId),
		refetchOnMount: true,
	});

	// Type assertion for product with all details
	const productWithDetails = product as ProductWithDetails | undefined;

	// Track product visit when route param changes and product data is available
	// The hook handles deduplication automatically, so we don't need a ref
	useEffect(() => {
		if (productId && productWithDetails?.id && productWithDetails?.slug) {
			addRecentlyVisited(productWithDetails.id, productWithDetails.slug);
		}
	}, [
		productId,
		productWithDetails?.id,
		productWithDetails?.slug,
		addRecentlyVisited,
	]);

	// Get recently visited product IDs (excluding current product)
	const recentlyVisitedProductIds = useMemo(() => {
		const allIds = getRecentlyVisitedProductIds();
		// Exclude current product from recently visited list
		if (productWithDetails?.id) {
			return allIds.filter((id) => id !== productWithDetails.id);
		}
		return allIds;
	}, [getRecentlyVisitedProductIds, productWithDetails?.id]);

	// Determine if product is flooring (sold in packs with area in m²)
	const isFlooringProduct = Boolean(productWithDetails?.squareMetersPerPack);

	// Map full unit names to short labels for UI display
	const getUnitShortLabel = (unit: string | undefined): string => {
		if (!unit) return "шт";
		const normalized = unit.trim().toLowerCase();
		switch (normalized) {
			case "квадратный метр":
				return "м²";
			case "погонный метр":
				return "м.п.";
			case "литр":
				return "л";
			case "штука":
				return "шт";
			case "упаковка":
				return "упак";
			default:
				return unit; // fallback to raw value if unknown
		}
	};

	// Auto-select first variation if no search params and product has variations
	// This runs once when product loads and no search params exist
	useEffect(() => {
		if (
			!productWithDetails?.hasVariations ||
			!productWithDetails.variations?.length
		)
			return;

		// Check if any search params are set
		const hasAnySearchParams = Object.values(search).some(
			(value) => value !== undefined,
		);
		if (hasAnySearchParams) return;

		// Find first variation by sort order
		const sortedVariations = [...productWithDetails.variations].sort((a, b) => {
			return (b.sort ?? 0) - (a.sort ?? 0);
		});

		const firstVariation = sortedVariations[0];
		if (firstVariation?.attributes?.length > 0) {
			// Build search params dynamically from first variation's attributes
			const autoSearchParams: Record<string, string | undefined> = {};

			firstVariation.attributes.forEach((attr: VariationAttribute) => {
				// Convert attribute name to slug for URL
				const attribute = attributes?.find((a) => a.name === attr.attributeId);
				const slug =
					attribute?.slug || attr.attributeId.toLowerCase().replace(/_/g, "-");
				autoSearchParams[slug] = attr.value;
			});

			// Navigate with auto-selected variation
			navigate({
				search: autoSearchParams as Record<string, string | undefined>,
				replace: true,
			});
		}
	}, [productWithDetails, search, navigate, attributes]);

	// Use variation selection hook with URL state for product page
	const { selectedVariation, selectedAttributes } = useVariationSelection({
		product: productWithDetails as unknown as ProductWithVariations | null,
		cartItems: cart.items,
		search, // Providing search enables URL state mode
		onVariationChange: () => setQuantity(1), // Reset quantity when variation changes
		attributes: attributes || [], // Pass database attributes for slug conversion
	});

	// Find variation for pricing (regardless of stock status)
	const variationForPricing = useMemo(() => {
		if (
			!productWithDetails?.hasVariations ||
			!productWithDetails.variations ||
			!selectedAttributes
		) {
			return null;
		}

		// Find variation that matches all selected attributes, regardless of stock
		return (
			productWithDetails.variations.find((variation) => {
				return Object.entries(selectedAttributes).every(([attrId, value]) =>
					variation.attributes.some(
						(attr: VariationAttribute) =>
							attr.attributeId === attrId && attr.value === value,
					),
				);
			}) || null
		);
	}, [productWithDetails, selectedAttributes]);

	// Calculate current price based on selected variation
	const currentPrice = useMemo(() => {
		if (!productWithDetails) return 0;
		// If product has variations, always use variation price
		if (productWithDetails.hasVariations) {
			// Use selectedVariation for available stock, or variationForPricing for out-of-stock items
			const relevantVariation = selectedVariation || variationForPricing;
			return relevantVariation?.price || 0;
		}
		// If product price is zero, use variation price (if available)
		if (
			productWithDetails.price === 0 &&
			(selectedVariation || variationForPricing)
		) {
			const relevantVariation = selectedVariation || variationForPricing;
			return relevantVariation?.price || 0;
		}
		return productWithDetails.price || 0;
	}, [selectedVariation, variationForPricing, productWithDetails]);

	// Calculate current discount based on selected variation
	const currentDiscount = useMemo(() => {
		// Use selectedVariation for available stock, or variationForPricing for out-of-stock items
		const relevantVariation = selectedVariation || variationForPricing;
		if (relevantVariation?.discount) {
			return relevantVariation.discount;
		}
		return productWithDetails?.discount || null;
	}, [selectedVariation, variationForPricing, productWithDetails?.discount]);

	// Calculate original price (before discount)
	const originalPrice = useMemo(() => {
		if (currentDiscount && currentDiscount > 0) {
			return currentPrice / (1 - currentDiscount / 100);
		}
		return null;
	}, [currentPrice, currentDiscount]);

	// Check if product can be added to cart
	const canAddToCart = useMemo(() => {
		if (!productWithDetails?.isActive) return false;
		if (productWithDetails.hasVariations && !selectedVariation) return false;
		return true;
	}, [productWithDetails, selectedVariation]);

	// Define all callbacks before any conditional returns
	const incrementQuantity = useCallback(() => {
		setQuantity((prev) => prev + 1);
	}, []);

	const decrementQuantity = useCallback(() => {
		if (quantity > 1) {
			setQuantity((prev) => prev - 1);
		}
	}, [quantity]);

	const handleQuantityChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const value = e.target.value;
			// Allow empty input while typing
			if (value === "") {
				setQuantity(1);
				return;
			}
			const numValue = parseInt(value, 10);
			if (!Number.isNaN(numValue) && numValue > 0) {
				setQuantity(numValue);
			}
		},
		[],
	);

	// Handle add to cart
	const handleAttributeChange = useCallback(
		(attributeId: string, value: string) => {
			const newSearch = { ...search };

			// Convert attribute name to slug for URL
			const attribute = attributes?.find((attr) => attr.name === attributeId);
			const slug =
				attribute?.slug || attributeId.toLowerCase().replace(/_/g, "-");

			newSearch[slug] = value;

			// Remove undefined values
			Object.keys(newSearch).forEach((key) => {
				if (newSearch[key] === undefined) {
					delete newSearch[key];
				}
			});

			navigate({
				search: newSearch as Record<string, string | undefined>,
				replace: true,
			});
		},
		[search, navigate, attributes],
	);

	const handleAddToCart = useCallback(async () => {
		if (!productWithDetails || !canAddToCart) return;

		const success = await addProductToCart(
			productWithDetails as unknown as Product,
			quantity,
			selectedVariation,
			selectedAttributes,
		);

		if (success) {
			setQuantity(1); // Reset quantity after successful add
		}
	}, [
		productWithDetails,
		quantity,
		selectedVariation,
		selectedAttributes,
		canAddToCart,
		addProductToCart,
	]);

	// Calculate total price for display
	const totalPrice = currentPrice * quantity;

	// Get images array - should already be an array from server
	const productImages = useMemo(() => {
		if (!productWithDetails?.images) return [];

		// Images should already be an array from the server
		if (Array.isArray(productWithDetails.images)) {
			return productWithDetails.images;
		}

		// Fallback: try parsing if it's somehow a string (backward compatibility)
		if (typeof productWithDetails.images === "string") {
			try {
				return JSON.parse(productWithDetails.images) as string[];
			} catch {
				return [];
			}
		}

		return [];
	}, [productWithDetails?.images]);

	// Show skeleton while loading
	if (isLoadingProduct || isFetchingProduct || !productWithDetails) {
		return <ProductPageSkeleton />;
	}

	return (
		<div className="min-h-screen bg-background">
			{/* Desktop: Full-width gallery with overlay sticky product info */}
			<div className="hidden lg:block">
				{/* Wrapper that spans full height for sticky positioning */}
				<div className="relative">
					{/* Full-width Image Gallery */}
					<div className="w-full">
						<ImageGallery
							images={productImages}
							alt={productWithDetails?.name || "Product"}
							productSlug={productWithDetails?.slug}
							size="default"
						/>
					</div>

					{/* Sticky Product Info Panel - Overlay on top of gallery, then sticks */}
					<div className="absolute top-0 right-0 w-full h-full pointer-events-none">
						<div className="sticky top-16 w-full lg:w-2/5 min-w-0 h-fit ml-auto pointer-events-auto">
							<div className="flex items-start justify-end p-8 min-w-0">
								<div className="product-info-overlay p-6 max-w-[45vw] rounded-lg shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] min-w-0 w-fit border border-border bg-background/95 backdrop-blur-sm relative">
									{/* Admin Edit Button - Top Right Corner */}
									{isAdmin && productWithDetails?.id && (
										<div className="absolute top-4 right-4">
											<Button
												asChild
												variant="outline"
												size="sm"
												className="flex items-center gap-2"
											>
												<Link
													to="/dashboard/products/$productId/edit"
													params={{
														productId: productWithDetails.id.toString(),
													}}
												>
													<Icon name="edit" size={16} />
													<span>Редактировать</span>
												</Link>
											</Button>
										</div>
									)}
									<div className="space-y-6">
										{/* Breadcrumb Navigation */}
										<div>
											<Breadcrumb>
												<BreadcrumbList>
													<BreadcrumbItem>
														<BreadcrumbLink asChild>
															<Link
																to="/"
																className="text-gray-400 hover:text-gray-600"
															>
																Главная
															</Link>
														</BreadcrumbLink>
													</BreadcrumbItem>
													<BreadcrumbSeparator />
													<BreadcrumbItem>
														<BreadcrumbLink asChild>
															<Link
																to="/store"
																className="text-gray-400 hover:text-gray-600"
																viewTransition={true}
																resetScroll={false}
															>
																Ламинат
															</Link>
														</BreadcrumbLink>
													</BreadcrumbItem>
													<BreadcrumbSeparator />
													<BreadcrumbItem>
														<BreadcrumbPage className="text-gray-400">
															{productWithDetails?.name}
														</BreadcrumbPage>
													</BreadcrumbItem>
												</BreadcrumbList>
											</Breadcrumb>
										</div>

										{/* Product Title */}
										<div>
											<h1
												className=""
												style={{
													viewTransitionName: `product-name-${productWithDetails?.slug}`,
												}}
											>
												{productWithDetails?.name || "Product"}
											</h1>
											<div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-sm">
												{/* Brand Logo/Name */}
												{productWithDetails?.brand && (
													<Link
														to="/store"
														search={{ brand: productWithDetails.brand.slug }}
														className="flex items-center gap-2 hover:underline"
													>
														{productWithDetails.brand.image ? (
															<img
																src={productWithDetails.brand.image}
																alt={productWithDetails.brand.name}
																className="h-6 w-auto"
															/>
														) : (
															<span className="font-medium">
																{productWithDetails.brand.name}
															</span>
														)}
													</Link>
												)}

												{/* SKU */}
												{productWithDetails?.sku && (
													<div className="flex items-center gap-1">
														<span className="text-foreground-muted">
															Артикул:
														</span>

														{productWithDetails.sku}
													</div>
												)}

												{/* Country of Origin */}
												{productWithDetails?.brand?.country && (
													<div className="flex items-center gap-1.5">
														{productWithDetails.brand.country.flagImage && (
															<img
																src={`${ASSETS_BASE_URL}/${productWithDetails.brand.country.flagImage}`}
																alt={productWithDetails.brand.country.name}
																className="h-4 w-auto"
															/>
														)}
														<span className="font-semibold">
															{productWithDetails.brand.country.name}
														</span>
														<span className="text-gray-500">родина бренда</span>
													</div>
												)}

												{/* Collection */}
												{productWithDetails?.collection && (
													<div className="flex items-center gap-1">
														<span className="text-foreground-muted">
															Коллекция:
														</span>
														<Link
															to="/store"
															search={{
																collection: productWithDetails.collection.slug,
															}}
															className="font-semibold hover:underline"
														>
															{productWithDetails.collection.name}
														</Link>
													</div>
												)}
											</div>
										</div>

										{/* Wrapper for Price, Quantity, and Add to Cart */}
										<div className="border border-border rounded-lg p-2 space-y-4 min-w-0 max-w-full">
											{/* Price and Quantity */}
											<div className="flex items-stretch gap-0 min-w-0 w-full">
												{/* Price Box */}
												<div className="bg-muted px-4 py-3 rounded-lg flex-shrink-0">
													<div className="text-sm text-gray-500 mb-1">
														Цена за{" "}
														<span className="whitespace-nowrap">
															{isFlooringProduct
																? "м²"
																: getUnitShortLabel(
																		productWithDetails?.unitOfMeasurement,
																	)}
														</span>
													</div>
													<div
														className="text-2xl font-bold text-gray-800"
														style={{
															viewTransitionName: `product-price-${productWithDetails?.slug}`,
														}}
													>
														{currentPrice.toLocaleString()} р
													</div>
												</div>

												{/* Icon divider */}
												<div className="flex-shrink-0 mx-2 flex items-center">
													<Icon
														name="plus"
														size={28}
														className="text-foreground-muted rotate-45"
													/>
												</div>

												{/* Quantity Selector */}
												<div className="flex flex-col min-w-0 flex-1 overflow-hidden">
													<div className="flex gap-1 items-stretch min-w-0">
														<button
															type="button"
															onClick={decrementQuantity}
															disabled={quantity <= 1}
															className="flex-shrink-0 w-10 h-full flex items-center justify-center text-primary bg-muted hover:bg-secondary active:bg-muted-hover rounded-[15px] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
														>
															<Icon name="minus" size={20} />
														</button>
														<div className="text-center bg-muted rounded-lg p-2 flex items-center justify-center min-w-0 w-fit max-w-full">
															<div className="flex flex-col items-center gap-0 min-w-0">
																{productWithDetails?.squareMetersPerPack && (
																	<div className="flex items-baseline gap-1 justify-center min-w-0">
																		<div className="text-sm font-normal flex-shrink-0">
																			Площадь
																		</div>
																		<div className="text-xl font-normal whitespace-nowrap">
																			{(
																				quantity *
																				productWithDetails.squareMetersPerPack
																			).toFixed(2)}{" "}
																			м²
																		</div>
																	</div>
																)}
																<div className="flex items-baseline gap-1 justify-center min-w-0">
																	{isFlooringProduct && (
																		<div className="text-sm font-normal whitespace-nowrap flex-shrink-0">
																			Упаковок
																		</div>
																	)}
																	<Input
																		type="number"
																		min={1}
																		value={quantity}
																		onChange={handleQuantityChange}
																		className="text-xl font-normal text-center border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto min-w-0 field-sizing-content [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
																	/>
																</div>
															</div>
														</div>
														<button
															type="button"
															onClick={incrementQuantity}
															className="flex-shrink-0 w-10 h-full flex items-center justify-center text-primary bg-muted hover:bg-secondary active:bg-muted-hover rounded-[15px] cursor-pointer"
														>
															<Icon name="plus" size={20} />
														</button>
													</div>
												</div>
											</div>

											{/* Variation Selector */}
											{product?.hasVariations && (
												<VariationSelector
													product={product as unknown as ProductWithVariations}
													selectedAttributes={selectedAttributes}
													search={search}
													onAttributeChange={handleAttributeChange}
												/>
											)}

											{/* Price and Add to Cart */}
											<div className="bg-muted rounded-lg p-2 flex flex-col md:flex-row gap-4 items-baseline">
												{/* Price Display */}
												<div className="flex flex-col gap-2">
													{/* Discount Row */}
													{currentDiscount && originalPrice && (
														<div className="flex items-baseline justify-between gap-6">
															<div className="text-left">Скидка</div>
															<div className="flex items-baseline gap-3 text-right">
																<span className="text-lg line-through ">
																	{originalPrice.toLocaleString()} р
																</span>
																<span className="px-2 py-1 bg-accent text-accent-foreground text-sm font-semibold rounded-[5px]">
																	{currentDiscount}%
																</span>
															</div>
														</div>
													)}

													{/* Total Row */}
													<div className="flex items-baseline justify-between gap-6">
														<div className="text-left">Итого</div>
														<span className="text-3xl font-bold text-right">
															{totalPrice.toLocaleString()} р
														</span>
													</div>
												</div>

												{/* Add to Cart Button */}
												<div className="flex-1 flex">
													<Button
														onClick={handleAddToCart}
														disabled={!canAddToCart}
														size="lg"
														className="w-full h-full"
													>
														{!canAddToCart ? "Недоступно" : "В корзину"}
													</Button>
												</div>
											</div>

											{/* Store Locations */}
											{productWithDetails?.storeLocations &&
												productWithDetails.storeLocations.length > 0 && (
													<div className="text-sm">
														<span className="text-foreground-muted">
															Доступно в магазинах:{" "}
														</span>
														<span className="text-foreground">
															{productWithDetails.storeLocations?.map(
																(location, index) => (
																	<span key={location.id}>
																		<Link
																			to="/contacts"
																			className="text-accent hover:underline"
																		>
																			{location.address}
																		</Link>
																		{index <
																			(productWithDetails.storeLocations
																				?.length ?? 0) -
																				1 && ", "}
																	</span>
																),
															)}
														</span>
													</div>
												)}
										</div>

										{/* Important Note */}
										{product?.importantNote && (
											<div className="prose prose-sm max-w-none">
												<ReactMarkdown
													components={markdownComponents}
													rehypePlugins={rehypePlugins}
												>
													{productWithDetails?.importantNote?.replace(
														/\\n/g,
														"\n",
													) ?? ""}
												</ReactMarkdown>
											</div>
										)}
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Description and Characteristics Section */}
					{(product?.description ||
						product?.hasVariations ||
						(product?.productAttributes &&
							Array.isArray(productWithDetails.productAttributes) &&
							productWithDetails.productAttributes.length > 0)) && (
						<div className="max-w-7xl mx-auto px-4 py-8 lg:pr-[45%]">
							<div className="flex flex-col gap-8">
								{/* Characteristics */}
								{(product?.hasVariations ||
									(product?.productAttributes &&
										Array.isArray(productWithDetails.productAttributes) &&
										productWithDetails.productAttributes.length > 0)) && (
									<div className="space-y-4">
										<h2>Характеристики</h2>
										<div>
											{/* Product-level attributes - only show standardized attributes */}
											{(productWithDetails?.productAttributes ?? [])
												// Filter to only show attributes that exist in the standardized list
												.filter(
													(attr: { attributeId: string; value: string }) => {
														if (!attributes || !attributes.length) return false;
														// Check if attribute is in the standardized list
														const attribute = attributes.find(
															(a) =>
																a.id.toString() === attr.attributeId ||
																a.slug === attr.attributeId ||
																a.name === attr.attributeId,
														);
														// Only show if it's a standardized attribute
														return attribute !== undefined;
													},
												)
												.map((attr: { attributeId: string; value: string }) => {
													const attribute = attributes?.find(
														(a) =>
															a.id.toString() === attr.attributeId ||
															a.slug === attr.attributeId ||
															a.name === attr.attributeId,
													);
													const displayName = attribute
														? attribute.name
														: attr.attributeId;

													return (
														<div
															key={attr.attributeId}
															className="flex justify-between items-center py-2"
														>
															<span className="text-foreground-muted">
																{displayName}
															</span>
															<span>{attr.value}</span>
														</div>
													);
												})}

											{/* Variation attributes */}
											{product?.hasVariations &&
												(() => {
													// Find the variation with attributes that matches the selected variation
													const productWithVariations =
														product as unknown as ProductWithVariations;
													let variationToShow = null;

													if (selectedVariation) {
														// Find the variation with attributes that matches the selected variation ID
														variationToShow =
															productWithVariations.variations?.find(
																(v) => v.id === selectedVariation.id,
															);
													}

													// Fallback to first variation if no match found
													if (!variationToShow) {
														variationToShow =
															productWithVariations.variations?.[0];
													}

													if (!variationToShow?.attributes) return null;

													return variationToShow.attributes.map(
														(attr: VariationAttribute) => {
															const attribute = attributes?.find(
																(a) => a.id.toString() === attr.attributeId,
															);
															const displayName = attribute
																? attribute.name
																: attr.attributeId;

															return (
																<div
																	key={attr.attributeId}
																	className="flex justify-between items-center py-2"
																>
																	<span className="text-foreground-muted font-normal">
																		{displayName}
																	</span>
																	<span className="text-foreground font-normal">
																		{attr.value}
																	</span>
																</div>
															);
														},
													);
												})()}
										</div>
									</div>
								)}

								{/* Description */}
								{product?.description && (
									<div className="space-y-4">
										<h2>Описание</h2>
										<div className="prose max-w-none">
											<ReactMarkdown
												components={markdownComponents}
												rehypePlugins={rehypePlugins}
											>
												{productWithDetails?.description?.replace(
													/\\n/g,
													"\n",
												) ?? ""}
											</ReactMarkdown>
										</div>
									</div>
								)}
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Mobile: Standard layout */}
			<div className="lg:hidden max-w-7xl mx-auto px-4 py-8">
				<div className="flex flex-col gap-8">
					{/* Image Gallery */}
					<div className="w-full">
						<ImageGallery
							images={productImages}
							alt={productWithDetails?.name || "Product"}
							productSlug={productWithDetails?.slug}
							size="default"
						/>
					</div>

					{/* Product Info */}
					<div className="w-full">
						<div className="space-y-6">
							{/* Breadcrumb Navigation */}
							<div>
								<Breadcrumb>
									<BreadcrumbList>
										<BreadcrumbItem>
											<BreadcrumbLink asChild>
												<Link
													to="/"
													className="text-gray-400 hover:text-gray-600"
												>
													Главная
												</Link>
											</BreadcrumbLink>
										</BreadcrumbItem>
										<BreadcrumbSeparator />
										<BreadcrumbItem>
											<BreadcrumbLink asChild>
												<Link
													to="/store"
													className="text-gray-400 hover:text-gray-600"
													viewTransition={true}
													resetScroll={false}
												>
													Ламинат
												</Link>
											</BreadcrumbLink>
										</BreadcrumbItem>
										<BreadcrumbSeparator />
										<BreadcrumbItem>
											<BreadcrumbPage className="text-gray-400">
												{productWithDetails?.name}
											</BreadcrumbPage>
										</BreadcrumbItem>
									</BreadcrumbList>
								</Breadcrumb>
							</div>

							{/* Product Title */}
							<div>
								<h1
									className=""
									style={{
										viewTransitionName: `product-name-${productWithDetails?.slug}`,
									}}
								>
									{productWithDetails?.name || "Product"}
								</h1>
								<div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600">
									{/* Brand Logo/Name */}
									{productWithDetails?.brand && (
										<Link
											to="/store"
											search={{ brand: productWithDetails.brand.slug }}
											className="flex items-center gap-2 hover:underline"
										>
											{productWithDetails.brand.image ? (
												<img
													src={productWithDetails.brand.image}
													alt={productWithDetails.brand.name}
													className="h-6 w-auto"
												/>
											) : (
												<span className="font-medium">
													{productWithDetails.brand.name}
												</span>
											)}
										</Link>
									)}

									{/* SKU */}
									{productWithDetails?.sku && (
										<div className="flex items-center gap-1">
											<span className="text-gray-500">Артикул:</span>

											{productWithDetails.sku}
										</div>
									)}

									{/* Country of Origin */}
									{productWithDetails?.brand?.country && (
										<div className="flex items-center gap-1.5">
											{productWithDetails.brand.country.flagImage && (
												<img
													src={`${ASSETS_BASE_URL}/${productWithDetails.brand.country.flagImage}`}
													alt={productWithDetails.brand.country.name}
													className="h-4 w-auto"
												/>
											)}
											<span className="font-semibold">
												{productWithDetails.brand.country.name}
											</span>
											<span className="text-gray-500">родина бренда</span>
										</div>
									)}

									{/* Collection */}
									{productWithDetails?.collection && (
										<div className="flex items-center gap-1">
											<span className="text-gray-500">Коллекция:</span>
											<Link
												to="/store"
												search={{
													collection: productWithDetails.collection.slug,
												}}
												className="font-semibold hover:underline"
											>
												{productWithDetails.collection.name}
											</Link>
										</div>
									)}
								</div>
							</div>

							{/* Wrapper for Price, Quantity, and Add to Cart */}
							<div className="border border-border rounded-lg p-2 space-y-4 min-w-0">
								{/* Price and Quantity */}
								<div className="flex items-stretch gap-0 min-w-0">
									{/* Price Box */}
									<div className="bg-muted px-4 py-3 rounded-lg flex-shrink-0">
										<div className="text-sm text-gray-500 mb-1">
											Цена за{" "}
											<span className="whitespace-nowrap">
												{isFlooringProduct
													? "м²"
													: getUnitShortLabel(
															productWithDetails?.unitOfMeasurement,
														)}
											</span>
										</div>
										<div
											className="text-2xl font-bold text-gray-800"
											style={{
												viewTransitionName: `product-price-${productWithDetails?.slug}`,
											}}
										>
											{currentPrice.toLocaleString()} р
										</div>
									</div>

									{/* Icon divider */}
									<div className="flex-shrink-0 mx-2 flex items-center">
										<Icon
											name="plus"
											size={28}
											className="text-foreground-muted rotate-45"
										/>
									</div>

									{/* Quantity Selector */}
									<div className="flex-1 flex flex-col min-w-0">
										<div className="flex gap-1 items-stretch flex-1 min-w-0">
											<button
												type="button"
												onClick={decrementQuantity}
												disabled={quantity <= 1}
												className="flex-shrink-0 w-10 h-full flex items-center justify-center text-primary bg-muted hover:bg-secondary active:bg-muted-hover rounded-[15px] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
											>
												<Icon name="minus" size={20} />
											</button>
											<div className="text-center bg-muted rounded-lg p-2 flex items-center justify-center min-w-0 w-fit max-w-full">
												<div className="flex flex-col items-center gap-0 min-w-0">
													{productWithDetails?.squareMetersPerPack && (
														<div className="flex items-baseline gap-1 justify-center min-w-0">
															<div className="text-sm font-normal flex-shrink-0">
																Площадь
															</div>
															<div className="text-xl font-normal whitespace-nowrap">
																{(
																	quantity *
																	productWithDetails.squareMetersPerPack
																).toFixed(2)}{" "}
																м²
															</div>
														</div>
													)}
													<div className="flex items-baseline gap-1 justify-center min-w-0 w-full">
														{isFlooringProduct && (
															<div className="text-sm font-normal whitespace-nowrap flex-shrink-0">
																Упаковок
															</div>
														)}
														<Input
															type="number"
															min={1}
															value={quantity}
															onChange={handleQuantityChange}
															className="text-xl font-normal text-center border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto min-w-0 field-sizing-content [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
														/>
													</div>
												</div>
											</div>
											<button
												type="button"
												onClick={incrementQuantity}
												className="flex-shrink-0 w-10 h-full flex items-center justify-center text-primary bg-muted hover:bg-secondary active:bg-muted-hover rounded-[15px] cursor-pointer"
											>
												<Icon name="plus" size={20} />
											</button>
										</div>
									</div>
								</div>

								{/* Variation Selector */}
								{product?.hasVariations && (
									<VariationSelector
										product={product as unknown as ProductWithVariations}
										selectedAttributes={selectedAttributes}
										search={search}
										onAttributeChange={handleAttributeChange}
									/>
								)}

								{/* Price and Add to Cart */}
								<div className="bg-muted rounded-lg p-2 flex flex-col md:flex-row gap-4 items-baseline">
									{/* Price Display */}
									<div className="flex flex-col gap-2">
										{/* Discount Row */}
										{currentDiscount && originalPrice && (
											<div className="flex items-baseline justify-between gap-6">
												<div className="text-left">Скидка</div>
												<div className="flex items-baseline gap-3 text-right">
													<span className="text-lg line-through ">
														{originalPrice.toLocaleString()} р
													</span>
													<span className="px-2 py-1 bg-accent text-accent-foreground text-sm font-semibold rounded-[5px]">
														{currentDiscount}%
													</span>
												</div>
											</div>
										)}

										{/* Total Row */}
										<div className="flex items-baseline justify-between gap-6">
											<div className="text-left">Итого</div>
											<span className="text-3xl font-bold text-right">
												{totalPrice.toLocaleString()} р
											</span>
										</div>
									</div>

									{/* Add to Cart Button */}
									<div className="flex-1 flex">
										<Button
											onClick={handleAddToCart}
											disabled={!canAddToCart}
											size="lg"
											className="w-full h-full"
										>
											{!canAddToCart ? "Недоступно" : "В корзину"}
										</Button>
									</div>
								</div>

								{/* Store Locations */}
								{productWithDetails?.storeLocations &&
									productWithDetails.storeLocations.length > 0 && (
										<div className="text-sm">
											<span className="text-foreground-muted">
												Доступно в магазинах:{" "}
											</span>
											<span className="text-foreground">
												{productWithDetails.storeLocations?.map(
													(location, index) => (
														<span key={location.id}>
															<Link
																to="/contacts"
																className="text-accent hover:underline"
															>
																{location.address}
															</Link>
															{index <
																(productWithDetails.storeLocations?.length ??
																	0) -
																	1 && ", "}
														</span>
													),
												)}
											</span>
										</div>
									)}
							</div>

							{/* Important Note */}
							{product?.importantNote && (
								<div className="prose prose-sm max-w-none">
									<ReactMarkdown
										components={markdownComponents}
										rehypePlugins={rehypePlugins}
									>
										{productWithDetails?.importantNote?.replace(/\\n/g, "\n") ??
											""}
									</ReactMarkdown>
								</div>
							)}
						</div>
					</div>

					{/* Description and Characteristics Section */}
					{(product?.description ||
						product?.hasVariations ||
						(product?.productAttributes &&
							Array.isArray(productWithDetails.productAttributes) &&
							productWithDetails.productAttributes.length > 0)) && (
						<div className="w-full">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
								{/* Left Column - Characteristics */}
								{(product?.hasVariations ||
									(product?.productAttributes &&
										Array.isArray(productWithDetails.productAttributes) &&
										productWithDetails.productAttributes.length > 0)) && (
									<div className="space-y-4">
										<h2>Характеристики</h2>
										<div>
											{/* Product-level attributes - only show standardized attributes */}
											{(productWithDetails?.productAttributes ?? [])
												.filter(
													(attr: { attributeId: string; value: string }) => {
														if (!attributes || !attributes.length) return false;
														const attribute = attributes.find(
															(a) =>
																a.id.toString() === attr.attributeId ||
																a.slug === attr.attributeId ||
																a.name === attr.attributeId,
														);
														return attribute !== undefined;
													},
												)
												.map((attr: { attributeId: string; value: string }) => {
													const attribute = attributes?.find(
														(a) =>
															a.id.toString() === attr.attributeId ||
															a.slug === attr.attributeId ||
															a.name === attr.attributeId,
													);
													const displayName = attribute
														? attribute.name
														: attr.attributeId;

													return (
														<div
															key={attr.attributeId}
															className="flex justify-between items-center py-2"
														>
															<span className="text-foreground-muted">
																{displayName}
															</span>
															<span>{attr.value}</span>
														</div>
													);
												})}

											{/* Variation attributes */}
											{product?.hasVariations &&
												(() => {
													const productWithVariations =
														product as unknown as ProductWithVariations;
													let variationToShow = null;

													if (selectedVariation) {
														variationToShow =
															productWithVariations.variations?.find(
																(v) => v.id === selectedVariation.id,
															);
													}

													if (!variationToShow) {
														variationToShow =
															productWithVariations.variations?.[0];
													}

													if (!variationToShow?.attributes) return null;

													return variationToShow.attributes.map(
														(attr: VariationAttribute) => {
															const attribute = attributes?.find(
																(a) => a.id.toString() === attr.attributeId,
															);
															const displayName = attribute
																? attribute.name
																: attr.attributeId;

															return (
																<div
																	key={attr.attributeId}
																	className="flex justify-between items-center py-2"
																>
																	<span className="text-foreground-muted font-normal">
																		{displayName}
																	</span>
																	<span className="text-foreground font-normal">
																		{attr.value}
																	</span>
																</div>
															);
														},
													);
												})()}
										</div>
									</div>
								)}

								{/* Right Column - Description */}
								{product?.description && (
									<div className="space-y-4">
										<h2>Описание</h2>
										<div className="prose max-w-none">
											<ReactMarkdown
												components={markdownComponents}
												rehypePlugins={rehypePlugins}
											>
												{productWithDetails?.description?.replace(
													/\\n/g,
													"\n",
												) ?? ""}
											</ReactMarkdown>
										</div>
									</div>
								)}
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Recommended/Recently Visited Products Slider */}
			<div className="w-full max-w-7xl mx-auto px-4 py-8">
				<ProductSlider
					mode="recommended"
					title={
						hasRecentlyVisited ? "Вы недавно смотрели" : "Рекомендуемые товары"
					}
					recentlyVisitedProductIds={recentlyVisitedProductIds}
				/>
			</div>
		</div>
	);
}
