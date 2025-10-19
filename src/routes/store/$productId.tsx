import { useSuspenseQuery } from "@tanstack/react-query";
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
import {
	markdownComponents,
	rehypePlugins,
} from "~/components/ui/shared/MarkdownComponents";
import { ProductPageSkeleton } from "~/components/ui/store/skeletons/ProductPageSkeleton";
import { VariationSelector } from "~/components/ui/store/VariationSelector";
import { ASSETS_BASE_URL } from "~/constants/urls";
import { useProductAttributes } from "~/hooks/useProductAttributes";
import { useVariationSelection } from "~/hooks/useVariationSelection";
import { useCart } from "~/lib/cartContext";
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
	}, [product, search, navigate, cart.items, attributes]);

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
	const { selectedVariation, selectedAttributes } = useVariationSelection({
		product: syncedProduct as ProductWithVariations | null,
		cartItems: cart.items,
		search, // Providing search enables URL state mode
		onVariationChange: () => setQuantity(1), // Reset quantity when variation changes
		attributes: attributes || [], // Pass database attributes for slug conversion
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

	// Calculate total price for display
	const totalPrice = currentPrice * quantity;

	// Parse images from JSON string
	const productImages = useMemo(() => {
		if (!syncedProduct?.images) return [];
		try {
			return JSON.parse(syncedProduct.images) as string[];
		} catch {
			return [];
		}
	}, [syncedProduct?.images]);

	return (
		<main className="min-h-screen bg-[#fafafa]">
			<div className="max-w-7xl mx-auto px-4 py-8">
				{/* Breadcrumb Navigation */}
				<div className="mb-8">
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem>
								<BreadcrumbLink asChild>
									<Link to="/" className="text-gray-400 hover:text-gray-600">
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
									>
										Ламинат
									</Link>
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator />
							<BreadcrumbItem>
								<BreadcrumbPage className="text-gray-400">
									{syncedProduct?.name}
								</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</div>

				<div className="flex flex-col lg:flex-row gap-8">
					{/* Left Section - Image Gallery (60% width) */}
					<div className="w-full lg:w-3/5">
						<div className="flex gap-4">
							{/* Thumbnail Gallery */}
							<div className="w-24 flex-shrink-0">
								<div className="flex flex-col gap-2">
									{productImages.map((image, index) => (
										<button
											type="button"
											key={image}
											className={`w-24 h-24 rounded-sm overflow-hidden border-2 transition-colors ${
												index === 0
													? "border-red-600"
													: "border-transparent hover:border-gray-300"
											}`}
										>
											<img
												src={`${ASSETS_BASE_URL}/${image}`}
												alt={`${syncedProduct?.name || "Product"} ${index + 1}`}
												className="w-full h-full object-cover"
											/>
										</button>
									))}
								</div>
							</div>

							{/* Main Image */}
							<div className="flex-1">
								<div className="aspect-square bg-white rounded-lg overflow-hidden">
									<img
										src={`${ASSETS_BASE_URL}/${productImages[0]}`}
										alt={syncedProduct?.name || "Product"}
										className="w-full h-full object-contain"
									/>
								</div>
							</div>
						</div>
					</div>

					{/* Right Section - Product Info (40% width) */}
					<div className="w-full lg:w-2/5">
						<div className="space-y-6">
							{/* Product Title */}
							<div>
								<h1 className="text-3xl font-bold text-gray-800 mb-2">
									{syncedProduct?.name || "Product"}
								</h1>
								<div className="flex items-center gap-4 text-gray-600">
									{syncedProduct?.brand && (
										<span className="text-lg font-medium">
											{syncedProduct.brand.name}
										</span>
									)}
								</div>
								<div className="flex items-center gap-4 mt-2 text-sm text-gray-400"></div>
							</div>

							{/* Price and Quantity */}
							<div className="flex items-center gap-4">
								{/* Price Box */}
								<div className="bg-[#f5f5f5] px-4 py-3 rounded-lg">
									<div className="text-sm text-gray-500 mb-1">Цена за м²</div>
									<div className="text-2xl font-bold text-gray-800">
										{currentPrice.toLocaleString()} ₽
									</div>
									{syncedProduct?.squareMetersPerPack && (
										<div className="text-sm text-gray-500 mt-1">
											{syncedProduct.squareMetersPerPack} м² в упаковке
										</div>
									)}
									{currentDiscount && (
										<div className="text-sm text-green-600 font-medium">
											Скидка: {currentDiscount}%
										</div>
									)}
								</div>

								{/* Quantity Selector */}
								<div className="bg-[#f5f5f5] px-4 py-3 rounded-lg">
									<div className="flex items-center gap-3">
										<button
											type="button"
											onClick={decrementQuantity}
											disabled={quantity <= 1}
											className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
										>
											-
										</button>
										<div className="text-center">
											<div className="font-medium text-gray-800">
												{quantity} уп
											</div>
											{syncedProduct?.squareMetersPerPack && (
												<div className="text-xs text-gray-500">
													{(
														quantity * syncedProduct.squareMetersPerPack
													).toFixed(1)}{" "}
													м²
												</div>
											)}
											{/* Weight removed */}
										</div>
										<button
											type="button"
											onClick={incrementQuantity}
											disabled={
												!syncedProduct?.unlimitedStock &&
												quantity >= effectiveStock
											}
											className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
										>
											+
										</button>
									</div>
								</div>
							</div>

							{/* Variation Selector */}
							{syncedProduct?.hasVariations && (
								<VariationSelector
									product={syncedProduct as ProductWithVariations}
									selectedAttributes={selectedAttributes}
									search={search}
									onAttributeChange={handleAttributeChange}
								/>
							)}

							{/* Add to Cart Button */}
							<Button
								onClick={handleAddToCart}
								disabled={!canAddToCart}
								className=""
								size="lg"
							>
								<span className="text-xl font-thin">
									{totalPrice.toLocaleString()} ₽
								</span>
								<span className="text-lg">
									{!canAddToCart ? "Недоступно" : "В корзину"}
								</span>
							</Button>

							{/* Stock Info */}
							{!syncedProduct?.unlimitedStock && (
								<div className="text-sm text-gray-500">
									В наличии: {effectiveStock} шт
								</div>
							)}

							{/* Product Description */}
							{syncedProduct?.description && (
								<div className="prose max-w-none">
									<ReactMarkdown
										components={markdownComponents}
										rehypePlugins={rehypePlugins}
									>
										{syncedProduct.description}
									</ReactMarkdown>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</main>
	);
}
