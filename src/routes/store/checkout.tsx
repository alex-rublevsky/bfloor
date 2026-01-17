import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import React, { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/shared/Button";
import { Image } from "~/components/ui/shared/Image";
import { Link } from "~/components/ui/shared/Link";
import { Textarea } from "~/components/ui/shared/TextArea";
import type { EnrichedCartItem } from "~/hooks/useEnrichedCart";
import { useEnrichedCart } from "~/hooks/useEnrichedCart";
import {
	getAttributeDisplayName,
	useProductAttributes,
} from "~/hooks/useProductAttributes";
import { useCart } from "~/lib/cartContext";
import { getStoreProductsFromInfiniteCache } from "~/utils/storeCache";
import { createOrder } from "~/server_functions/dashboard/orders/orderCreation";
import { sendOrderEmails } from "~/server_functions/sendOrderEmails";
import type { ProductWithVariations } from "~/types";

interface Address {
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	streetAddress: string;
	city: string;
	state: string;
	country: string;
	zipCode: string;
}

interface CustomerInfo {
	notes?: string;
	shippingMethod?: string;
	shippingAddress?: Address;
}

export const Route = createFileRoute("/store/checkout")({
	component: CheckoutPage,
});

function CheckoutPage() {
	return <CheckoutScreen />;
}

function CheckoutScreen() {
	const { cart, clearCart } = useCart();
	const { data: attributes } = useProductAttributes();
	const enrichedItems = useEnrichedCart(cart.items);
	const queryClient = useQueryClient();
	const formRef = React.useRef<HTMLFormElement>(null);
	const notesId = useId();
	const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
		notes: "",
		shippingMethod: "standard",
	})

	// Order creation mutation with much better UX
	const orderMutation = useMutation({
		mutationFn: async (orderData: {
			customerInfo: CustomerInfo;
			cartItems: EnrichedCartItem[];
			products: ProductWithVariations[];
		}) => {
			// Step 1: Create order
			const orderResult = await createOrder({ data: orderData });
			if (!orderResult.success) {
				throw new Error("Failed to create order");
			}

			// Validate orderId exists
			if (!orderResult.orderId) {
				throw new Error("Order was created but no order ID was returned");
			}

			// Step 2: Send emails
			try {
				const emailResult = await sendOrderEmails({
					data: {
						orderId: orderResult.orderId,
						customerInfo: orderData.customerInfo,
						cartItems: orderData.cartItems,
						orderAmounts: {
							subtotalAmount: subtotal,
							discountAmount: totalDiscount,
						},
						totalAmount: total,
					},
				})

				return {
					orderId: orderResult.orderId,
					emailWarnings: emailResult.emailWarnings,
				}
			} catch (_emailError) {
				// Order succeeded, but emails failed - still return success
				return {
					orderId: orderResult.orderId,
					emailWarnings: ["Не удалось отправить письма с подтверждением"],
				}
			}
		},
		onSuccess: ({ orderId, emailWarnings }) => {
			// Show appropriate success message
			if (emailWarnings && emailWarnings.length > 0) {
				toast.warning(
					`Заказ успешно размещён! ${emailWarnings.join(", ")}. Наша команда свяжется с вами в ближайшее время.`,
					{ duration: 5000 },
				)
			} else {
				toast.success(
					"Заказ размещён и письма с подтверждением отправлены! 🎉",
					{
						duration: 3000,
					},
				)
			}

			// Pass display-ready order data optimistically to success page
			const orderData = {
				orderId,
				customerInfo,
				// Transform cart items to match order page display structure
				items: enrichedItems.map((item, index) => ({
					id: index,
					productName: item.productName,
					quantity: item.quantity,
					unitAmount: item.price,
					finalAmount: item.discount
						? item.price * (1 - item.discount / 100) * item.quantity
						: item.price * item.quantity,
					discountPercentage: item.discount,
					attributes: item.attributes || {},
					image: item.image,
				})),
				subtotalAmount: subtotal,
				discountAmount: totalDiscount,
				totalAmount: total,
				shippingAmount: 0, // Always 0 for new orders
				timestamp: Date.now(),
			}

			// Store in sessionStorage for the success page
			sessionStorage.setItem("orderSuccess", JSON.stringify(orderData));

			// Small delay to ensure success message is seen, then redirect
			setTimeout(() => {
				// Clear the cart AFTER redirect to avoid showing "cart is empty"
				clearCart()
				window.location.href = `/order/${orderId}?new=true`;
			}, 1000)
		},
		onError: (error: Error) => {
			toast.error(
				error.message ||
					"Не удалось разместить заказ. Пожалуйста, попробуйте снова.",
				{
					duration: 5000,
				},
			)
		},
	})

	const isLoading = orderMutation.isPending;

	// Handle button click
	const handleButtonClick = () => {
		if (cart.items.length === 0) {
			toast.error("Ваша корзина пуста");
		} else {
			// Submit the form
			const formElement = formRef.current;
			if (formElement) {
				formElement.requestSubmit();
			}
		}
	}

	// Get dynamic button text with fun loading messages
	const getButtonText = () => {
		if (isLoading) {
			// Fun, descriptive loading messages
			const loadingMessages = [
				"✨ Добавляем немного волшебства в ваш заказ...",
				"🎨 Подготавливаем ваши прекрасные товары...",
				"📦 Создаём ваш заказ с любовью...",
				"💫 Творим нашу магию...",
			]
			const randomMessage =
				loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
			return randomMessage;
		}
		if (cart.items.length === 0) return "Корзина пуста";
		return "Оформить заказ";
	}

	// Get dynamic button variant based on state
	const getButtonVariant = () => {
		if (cart.items.length === 0) return "destructive";
		return "default";
	}

	// Only redirect if cart is empty AND cart has been loaded AND order is not complete
	//   useEffect(() => {
	//     if (isCartLoaded && cart.items.length === 0 && !isOrderComplete) {
	//       router.push("/store");
	//     }
	//   }, [cart.items.length, router, isCartLoaded, isOrderComplete]);

	const handleInputChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>,
	) => {
		const { name, value } = e.target;
		setCustomerInfo((prev) => ({
			...prev,
			[name]: value,
		}))
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// If cart is empty
		if (cart.items.length === 0) {
			toast.error("Ваша корзина пуста");
			return
		}

		// Get products from TanStack Query cache for server validation
		const products = getStoreProductsFromInfiniteCache(queryClient);

		// Use the mutation instead of manual fetch
		orderMutation.mutate({
			customerInfo,
			cartItems: enrichedItems,
			products: products as unknown as ProductWithVariations[], // Type assertion to resolve type mismatch
		})
	}

	// Calculate cart totals
	const subtotal = enrichedItems.reduce(
		(total, item) => total + item.price * item.quantity,
		0,
	)

	// Calculate total discounts
	const totalDiscount = enrichedItems.reduce((total, item) => {
		if (item.discount) {
			const itemDiscount = item.price * item.quantity * (item.discount / 100);
			return total + itemDiscount;
		}
		return total;
	}, 0);

	const total = subtotal - totalDiscount;

	return (
		<div className="w-full px-4 pt-10 pb-20">
			<div className="max-w-[2000px] mx-auto">
				<h2 className="mb-4">Оформление заказа</h2>
				<div className="flex flex-col lg:flex-row gap-8">
					{/* Customer Information Form - Left Side */}
					<div className="flex-1">
						<form ref={formRef} onSubmit={handleSubmit}>
							<p className="mb-8">
								С вами свяжутся по поводу вариантов оплаты после размещения
								вашего заказа.
							</p>

							<div className="mb-8">
								<div className="mt-12">
									<h3 className=" mb-4">Дополнительная информация</h3>
									<div className="mb-6">
										<h4 className="block text-sm font-medium mb-2">
											Способ доставки
										</h4>
										<div className="flex gap-4">
											<Button
												type="button"
												onClick={() =>
													setCustomerInfo((prev) => ({
														...prev,
														shippingMethod: "standard",
													}))
												}
												variant={
													customerInfo.shippingMethod === "standard"
														? "default"
														: "outline"
												}
												className="flex-1"
											>
												Стандартная доставка
											</Button>
											<Button
												type="button"
												onClick={() =>
													setCustomerInfo((prev) => ({
														...prev,
														shippingMethod: "pickup",
													}))
												}
												variant={
													customerInfo.shippingMethod === "pickup"
														? "default"
														: "outline"
												}
												className="flex-1"
											>
												Самовывоз
											</Button>
										</div>
									</div>
									<div className="mb-6">
										<label
											className="block text-sm font-medium mb-2"
											htmlFor={notesId}
										>
											Примечания к заказу
										</label>
										<Textarea
											id={notesId}
											name="notes"
											value={customerInfo.notes}
											onChange={handleInputChange}
											rows={4}
											className="w-full p-2 border rounded-md"
											placeholder="Есть ли особые инструкции для вашего заказа?"
										/>
									</div>
								</div>
							</div>
						</form>
					</div>
					{/* Order Summary - Right Side */}
					<div className="lg:w-[27rem] lg:sticky lg:top-4 lg:self-start">
						<h5>Итого</h5>
						<div className="flex justify-between items-baseline my-2">
							<span>Промежуточная сумма</span>
							<span>CA${subtotal.toFixed(2)}</span>
						</div>
						{totalDiscount > 0 && (
							<div className="flex justify-between items-baseline my-2 text-red-600">
								<span>Скидка</span>
								<span>-CA${totalDiscount.toFixed(2)}</span>
							</div>
						)}
						<div className="flex justify-between items-baseline mb-4">
							<p>Доставка</p>
							<p className="text-right text-muted-foreground">
								Обсуждается после заказа
							</p>
						</div>
						<div className="flex justify-between items-baseline text-xl mb-2 border-t pt-4">
							<span>Всего</span>
							<h3 className="">CA${total.toFixed(2)}</h3>
						</div>
						<Button
							onClick={handleButtonClick}
							disabled={isLoading || cart.items.length === 0}
							variant={getButtonVariant()}
							className="w-full transition-all duration-300 ease-in-out disabled:cursor-not-allowed"
						>
							{isLoading && (
								<div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
							)}
							{getButtonText()}
						</Button>
						<div className="mt-6 pt-4 border-t">
							<h6>Товары в заказе</h6>
							{enrichedItems.map((item) => (
								<div
									key={`${item.productId}-${item.variationId || "default"}`}
									className="flex items-start gap-3 py-2"
								>
									{/* Product image */}
									<div className="shrink-0 relative w-16 h-16 bg-muted rounded overflow-hidden">
										{item.image ? (
											<Image
												src={`https://assets.rublevsky.studio/${item.image}`}
												alt={item.productName}
												className="object-cover"
											/>
										) : (
											<div className="w-full h-full flex items-center justify-center text-muted-foreground">
												Нет изображения
											</div>
										)}
									</div>
									{/* Product info */}
									<div className="grow">
										<Link
											href={`/product/${item.productSlug}`}
											id={"product-${item.productId}"}
										>
											{item.productName}
										</Link>
										{item.attributes &&
											Object.keys(item.attributes).length > 0 && (
												<p className="text-sm text-muted-foreground">
													{Object.entries(item.attributes)
														.map(
															([key, value]) =>
																`${getAttributeDisplayName(key, attributes || [])}: ${value}`,
														)
														.join(", ")}
												</p>
											)}
										<p className="text-sm text-muted-foreground">
											Количество: {item.quantity}
										</p>
									</div>
									{/* Price */}
									<div className="text-right">
										{item.discount ? (
											<>
												<p className="text-sm font-medium line-through text-muted-foreground">
													CA${(item.price * item.quantity).toFixed(2)}
												</p>
												<div className="flex items-center justify-end gap-2">
													<p className="text-sm font-medium">
														CA$
														{(
															item.price *
															(1 - item.discount / 100) *
															item.quantity
														).toFixed(2)}
													</p>
													<span className="text-xs text-red-600">
														{item.discount}% СКИДКА
													</span>
												</div>
											</>
										) : (
											<p className="text-sm font-medium">
												CA${(item.price * item.quantity).toFixed(2)}
											</p>
										)}
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
