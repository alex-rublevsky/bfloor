import { useSuspenseQuery } from "@tanstack/react-query";
import type { ErrorComponentProps } from "@tanstack/react-router";
import {
	createFileRoute,
	Link,
	stripSearchParams,
} from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Badge } from "~/components/ui/shared/Badge";
import { Button } from "~/components/ui/shared/Button";
import { FilterGroup } from "~/components/ui/shared/FilterGroup";
import ImageGallery from "~/components/ui/shared/ImageGallery";
import {
	markdownComponents,
	rehypePlugins,
} from "~/components/ui/shared/MarkdownComponents";
import { QuantitySelector } from "~/components/ui/shared/QuantitySelector";
import { TeaCategoryLearnMore } from "~/components/ui/shared/TeaCategoryLearnMore";
import { ProductPageSkeleton } from "~/components/ui/store/skeletons/ProductPageSkeleton";
import { getCountryName } from "~/constants/countries";
import { useVariationSelection } from "~/hooks/useVariationSelection";
import { useCart } from "~/lib/cartContext";
import {
	getAttributeDisplayName,
	PRODUCT_ATTRIBUTES,
} from "~/lib/productAttributes";
import { productQueryOptions, storeDataQueryOptions } from "~/lib/queryOptions";
import type {
	ProductWithDetails,
	ProductWithVariations,
	VariationAttribute,
} from "~/types";
import { seo } from "~/utils/seo";
import { getAvailableQuantityForVariation } from "~/utils/validateStock";

// Simple search params - no Zod needed for basic optional strings
const validateSearch = (search: Record<string, unknown>) => {
	// Get all known attribute parameter names from PRODUCT_ATTRIBUTES
	const knownParams = Object.keys(PRODUCT_ATTRIBUTES).map((id) =>
		id.toLowerCase(),
	);

	// Create base object with known attributes
	const result: Record<string, string | undefined> = {};
	knownParams.forEach((param) => {
		result[param] = (search[param] as string) || undefined;
	});

	// Handle any additional dynamic attributes
	Object.entries(search).forEach(([key, value]) => {
		if (!knownParams.includes(key)) {
			result[key] = (value as string) || undefined;
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
	pendingComponent: ProductPageSkeleton, // Show skeleton while loader is running

	// Loader prefetches data before component renders
	loader: async ({ context: { queryClient }, params: { productId } }) => {
		// Ensure both product and store data are loaded before component renders
		await Promise.all([
			queryClient.ensureQueryData(productQueryOptions(productId)),
			queryClient.ensureQueryData(storeDataQueryOptions()),
		]);
	},

	head: ({ loaderData }) => {
		const product = loaderData as ProductWithDetails | undefined;

		return {
			meta: [
				...seo({
					title: `${product?.name || "Product"} - Rublevsky Studio`,
					description:
						product?.description ||
						"Discover premium products at Rublevsky Studio store.",
				}),
			],
		};
	},

	validateSearch,
	// Strip undefined values from URL to keep it clean
	search: {
		middlewares: [
			stripSearchParams(
				Object.fromEntries(
					Object.keys(PRODUCT_ATTRIBUTES).map((id) => [
						id.toLowerCase(),
						undefined,
					]),
				),
			),
		],
	},
});

function ProductPage() {
	const { productId } = Route.useParams();
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	const [quantity, setQuantity] = useState(1);

	const { addProductToCart, cart } = useCart();

	// Use suspense query - data is guaranteed to be loaded by the loader
	const { data: product } = useSuspenseQuery(productQueryOptions(productId));

	// Get store data for products array (needed for cart operations)
	const { data: storeData } = useSuspenseQuery(storeDataQueryOptions());
	const products = storeData.products;

	// Auto-select first variation if no search params and product has variations
	// This runs once when product loads and no search params exist
	useEffect(() => {
		if (!product?.hasVariations || !product.variations?.length) return;

		// Check if any search params are set
		const hasAnySearchParams = Object.values(search).some(
			(value) => value !== undefined,
		);
		if (hasAnySearchParams) return;

		// Find first available variation
		const sortedVariations = [...product.variations].sort((a, b) => {
			if (product.unlimitedStock) {
				return (b.sort ?? 0) - (a.sort ?? 0);
			}

			// Calculate actual available stock considering cart items
			const aStock = getAvailableQuantityForVariation(
				product,
				a.id,
				cart.items,
			);
			const bStock = getAvailableQuantityForVariation(
				product,
				b.id,
				cart.items,
			);

			// Prioritize variations with stock > 0
			if (aStock > 0 && bStock === 0) return -1;
			if (bStock > 0 && aStock === 0) return 1;

			// If both have stock or both are out of stock, sort by sort order
			return (b.sort ?? 0) - (a.sort ?? 0);
		});

		const firstVariation = sortedVariations[0];
		if (firstVariation?.attributes?.length > 0) {
			// Build search params dynamically from first variation's attributes
			const autoSearchParams: Record<string, string | undefined> = {};

			firstVariation.attributes.forEach((attr: VariationAttribute) => {
				const paramName = attr.attributeId.toLowerCase();
				autoSearchParams[paramName] = attr.value;
			});

			// Navigate with auto-selected variation
			navigate({
				search: autoSearchParams as Record<string, string | undefined>,
				replace: true,
			});
		}
	}, [product, search, navigate, cart.items]);

	// Sync product data with cart context for stock info
	const syncedProduct = useMemo(() => {
		// Find the product in the cart context cache
		const cachedProduct = products.find((p) => p.id === product.id);
		if (cachedProduct) {
			// Merge loader data with cached stock info
			return {
				...product,
				stock: cachedProduct.stock,
				unlimitedStock: cachedProduct.unlimitedStock,
				variations: cachedProduct.variations,
			};
		}
		return product;
	}, [product, products]);

	// Use variation selection hook with URL state for product page
	const {
		selectedVariation,
		selectedAttributes,
		selectVariation,
		isAttributeValueAvailable,
	} = useVariationSelection({
		product: syncedProduct as ProductWithVariations | null,
		cartItems: cart.items,
		search, // Providing search enables URL state mode
		onVariationChange: () => setQuantity(1), // Reset quantity when variation changes
	});

	// Find variation for pricing (regardless of stock status)
	const variationForPricing = useMemo(() => {
		if (
			!syncedProduct?.hasVariations ||
			!syncedProduct.variations ||
			!selectedAttributes
		) {
			return null;
		}

		// Find variation that matches all selected attributes, regardless of stock
		return (
			syncedProduct.variations.find((variation) => {
				return Object.entries(selectedAttributes).every(([attrId, value]) =>
					variation.attributes.some(
						(attr) => attr.attributeId === attrId && attr.value === value,
					),
				);
			}) || null
		);
	}, [syncedProduct, selectedAttributes]);

	// Calculate current price based on selected variation
	const currentPrice = useMemo(() => {
		// If product has variations, always use variation price
		if (syncedProduct?.hasVariations) {
			// Use selectedVariation for available stock, or variationForPricing for out-of-stock items
			const relevantVariation = selectedVariation || variationForPricing;
			return relevantVariation?.price || 0;
		}
		// If product price is zero, use variation price (if available)
		if (
			syncedProduct?.price === 0 &&
			(selectedVariation || variationForPricing)
		) {
			const relevantVariation = selectedVariation || variationForPricing;
			return relevantVariation?.price || 0;
		}
		return syncedProduct?.price || 0;
	}, [
		selectedVariation,
		variationForPricing,
		syncedProduct?.price,
		syncedProduct?.hasVariations,
	]);

	// Calculate current discount based on selected variation
	const currentDiscount = useMemo(() => {
		// Use selectedVariation for available stock, or variationForPricing for out-of-stock items
		const relevantVariation = selectedVariation || variationForPricing;
		if (relevantVariation?.discount) {
			return relevantVariation.discount;
		}
		return syncedProduct?.discount || null;
	}, [selectedVariation, variationForPricing, syncedProduct?.discount]);

	// Calculate current shipping location based on variation/product hierarchy
	const currentShippingFrom = useMemo(() => {
		// Priority 1: Selected variation's shipping location
		const relevantVariation = selectedVariation || variationForPricing;
		if (
			relevantVariation?.shippingFrom &&
			relevantVariation.shippingFrom !== "" &&
			relevantVariation.shippingFrom !== "NONE"
		) {
			return relevantVariation.shippingFrom;
		}
		// Priority 2: Product's shipping location
		return syncedProduct?.shippingFrom &&
			syncedProduct?.shippingFrom !== "" &&
			syncedProduct?.shippingFrom !== "NONE"
			? syncedProduct?.shippingFrom
			: null;
	}, [selectedVariation, variationForPricing, syncedProduct?.shippingFrom]);

	// Calculate effective stock based on selected variation
	const effectiveStock = useMemo(() => {
		if (!syncedProduct) return 0;

		if (syncedProduct.unlimitedStock) {
			return Number.MAX_SAFE_INTEGER;
		}

		return getAvailableQuantityForVariation(
			syncedProduct as ProductWithVariations,
			selectedVariation?.id,
			cart.items,
		);
	}, [syncedProduct, selectedVariation, cart.items]);

	// Check if product can be added to cart
	const canAddToCart = useMemo(() => {
		if (!syncedProduct?.isActive) return false;
		if (syncedProduct.hasVariations && !selectedVariation) return false;
		if (!syncedProduct.unlimitedStock && effectiveStock <= 0) return false;
		return true;
	}, [syncedProduct, selectedVariation, effectiveStock]);

	// Define all callbacks before any conditional returns
	const incrementQuantity = useCallback(() => {
		if (syncedProduct?.unlimitedStock || quantity < effectiveStock) {
			setQuantity((prev) => prev + 1);
		}
	}, [quantity, effectiveStock, syncedProduct?.unlimitedStock]);

	const decrementQuantity = useCallback(() => {
		if (quantity > 1) {
			setQuantity((prev) => prev - 1);
		}
	}, [quantity]);

	const getUniqueAttributeValues = useCallback(
		(attributeId: string): string[] => {
			if (!syncedProduct?.variations) return [];

			const sortedVariations = [...syncedProduct.variations].sort(
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
		},
		[syncedProduct?.variations],
	);

	// Handle add to cart
	const handleAddToCart = useCallback(async () => {
		if (!syncedProduct || !canAddToCart) return;

		const success = await addProductToCart(
			syncedProduct,
			quantity,
			selectedVariation,
			selectedAttributes,
		);

		if (success) {
			setQuantity(1); // Reset quantity after successful add
		}
	}, [
		syncedProduct,
		quantity,
		selectedVariation,
		selectedAttributes,
		canAddToCart,
		addProductToCart,
	]);

	// Helper functions that don't need to be memoized
	const getUniqueAttributeNames = (): string[] => {
		if (!syncedProduct?.variations) return [];

		const attributeNames = new Set<string>();
		syncedProduct.variations.forEach((variation) => {
			variation.attributes.forEach((attr) => {
				attributeNames.add(attr.attributeId);
			});
		});

		return Array.from(attributeNames);
	};

	const attributeNames = getUniqueAttributeNames();

	return (
		<main className="min-h-screen flex flex-col lg:h-screen lg:overflow-hidden">
			<div className="grow flex items-start justify-center">
				<div className="w-full h-full flex flex-col lg:flex-row gap-0 lg:gap-10 items-start">
					{/* Image gallery with view transitions */}
					<div className="w-full lg:w-3/5 xl:w-2/3 flex flex-col lg:flex-row gap-2 lg:h-full self-start">
						<ImageGallery
							images={
								syncedProduct?.images
									? syncedProduct.images
											.split(",")
											.map((img: string) => img.trim())
									: []
							}
							alt={syncedProduct?.name || "Product"}
							className="lg:pl-4 lg:pt-4 lg:pb-4"
							productSlug={syncedProduct?.slug || productId}
						/>
					</div>

					{/* Product information */}
					<div className="w-full lg:w-2/5 xl:w-1/3 px-4 lg:px-0 lg:h-[100dvh] lg:overflow-y-auto pt-4 pb-20 lg:pr-4 scrollbar-none product-info-enter">
						<div className="space-y-6 w-full ">
							<h3>{syncedProduct.name}</h3>

							{/* Price */}
							<div className="flex gap-4 items-center">
								{currentDiscount ? (
									<div className="flex items-center gap-2">
										<Badge variant="green">{currentDiscount}% OFF</Badge>
										<div className="flex items-baseline gap-2">
											<h4>
												$
												{(currentPrice * (1 - currentDiscount / 100)).toFixed(
													2,
												)}{" "}
												CAD
											</h4>
											<span className="line-through text-muted-foreground">
												${currentPrice.toFixed(2)}
											</span>
										</div>
									</div>
								) : (
									<h4>${currentPrice.toFixed(2)} CAD</h4>
								)}

								{/* Stock information - moved here and updated styling */}
								{!syncedProduct.unlimitedStock && (
									<div>
										{effectiveStock > 0 ? (
											<Badge variant="outline">
												<span className="text-muted-foreground">
													In stock:{" "}
												</span>
												<span>{effectiveStock}</span>
											</Badge>
										) : null}
									</div>
								)}
							</div>

							{/* Variation selection */}
							{syncedProduct.hasVariations && attributeNames.length > 0 && (
								<div className="flex flex-wrap gap-4">
									{attributeNames.map((attributeId) => (
										<FilterGroup
											key={attributeId}
											title={getAttributeDisplayName(attributeId)}
											options={getUniqueAttributeValues(attributeId)}
											selectedOptions={selectedAttributes[attributeId] || null}
											onOptionChange={(value) => {
												if (value) {
													selectVariation(attributeId, value);
												}
											}}
											showAllOption={false}
											variant="default"
											getOptionAvailability={(value) =>
												isAttributeValueAvailable(attributeId, value)
											}
											titleClassName=""
											className=""
										/>
									))}
								</div>
							)}

							{/* Quantity selector and Add to cart */}
							<div className="flex flex-wrap items-center gap-4">
								<QuantitySelector
									quantity={quantity}
									onIncrement={incrementQuantity}
									onDecrement={decrementQuantity}
									minQuantity={1}
									maxQuantity={
										syncedProduct.unlimitedStock ? undefined : effectiveStock
									}
									disabled={!canAddToCart}
									size="default"
								/>
								<Button
									onClick={handleAddToCart}
									size="lg"
									disabled={!canAddToCart}
									cursorType={canAddToCart ? "add" : "default"}
								>
									{canAddToCart ? "Add to Cart" : "Out of Stock"}
								</Button>
							</div>

							{/* Metadata */}
							<div className="flex flex-wrap gap-6 text-sm">
								{(syncedProduct as ProductWithDetails).category && (
									<div className="flex flex-col">
										<span className="text-muted-foreground">Category</span>
										<Link
											to="/store"
											search={{
												category: (syncedProduct as ProductWithDetails).category
													?.slug,
											}}
											className="text-primary hover:underline"
										>
											{(syncedProduct as ProductWithDetails).category?.name}
										</Link>
									</div>
								)}
								{currentShippingFrom && (
									<div className="flex flex-col">
										<span className="text-muted-foreground">Ships from</span>
										<span className="text-foreground">
											{getCountryName(currentShippingFrom)}
										</span>
									</div>
								)}
								{/* Tea category learn more links */}
								<TeaCategoryLearnMore
									teaCategories={
										(syncedProduct as ProductWithDetails).teaCategories
									}
								/>
							</div>

							{/* Blog post link */}
							{(() => {
								const blogPost = (syncedProduct as ProductWithDetails).blogPost;
								const blogSlug = blogPost?.slug;
								if (!blogSlug) return null;

								return (
									<div className="pt-4">
										<div className="mb-2">
											{blogPost?.title ? (
												<>
													<span className="text-muted-foreground">
														From blog post:
													</span>{" "}
													<Link
														to="/blog/$slug"
														params={{ slug: blogSlug }}
														className="blurLink"
													>
														{blogPost.title}
													</Link>
												</>
											) : (
												<Link
													to="/blog/$slug"
													params={{ slug: blogSlug }}
													className="blurLink"
												>
													From blog post
												</Link>
											)}
										</div>
									</div>
								);
							})()}

							{/* Product description */}
							<div className="prose max-w-none">
								<ReactMarkdown
									components={markdownComponents}
									rehypePlugins={rehypePlugins}
								>
									{syncedProduct.description || ""}
								</ReactMarkdown>
							</div>
						</div>
					</div>
				</div>
			</div>
		</main>
	);
}
