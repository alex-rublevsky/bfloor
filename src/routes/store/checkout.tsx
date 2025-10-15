import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import React, { useCallback, useEffect, useId, useState } from "react";
import { toast } from "sonner";
import { AddressFields } from "~/components/ui/shared/AddressFields";
import { Button } from "~/components/ui/shared/Button";
import { Checkbox } from "~/components/ui/shared/Checkbox";
import { Image } from "~/components/ui/shared/Image";
import { Link } from "~/components/ui/shared/Link";
import NeumorphismCard from "~/components/ui/shared/NeumorphismCard";
import { Textarea } from "~/components/ui/shared/TextArea";
import type { EnrichedCartItem } from "~/hooks/useEnrichedCart";
import { useEnrichedCart } from "~/hooks/useEnrichedCart";
import { useCart } from "~/lib/cartContext";
import { getAttributeDisplayName } from "~/lib/productAttributes";
import { storeDataQueryOptions } from "~/lib/queryOptions";
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
	shippingAddress: Address;
	billingAddress?: Address;
	notes?: string;
	shippingMethod?: string;
}

export const Route = createFileRoute("/store/checkout")({
	component: CheckoutPage,
});

function CheckoutPage() {
	return <CheckoutScreen />;
}

function CheckoutScreen() {
	const { cart, clearCart } = useCart();
	const enrichedItems = useEnrichedCart(cart.items);
	const queryClient = useQueryClient();
	const formRef = React.useRef<HTMLFormElement>(null);
	const notesId = useId();
	const billingId = useId();
	const [useSeparateBilling, setUseSeparateBilling] = useState(false);
	const [showFormError, setShowFormError] = useState(false);
	const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
		shippingAddress: {
			firstName: "",
			lastName: "",
			email: "",
			phone: "",
			streetAddress: "",
			city: "",
			state: "",
			country: "",
			zipCode: "",
		},
		notes: "",
		shippingMethod: "standard",
	});

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
				});

				return {
					orderId: orderResult.orderId,
					emailWarnings: emailResult.emailWarnings,
				};
			} catch (_emailError) {
				// Order succeeded, but emails failed - still return success
				return {
					orderId: orderResult.orderId,
					emailWarnings: ["Confirmation emails failed to send"],
				};
			}
		},
		onSuccess: ({ orderId, emailWarnings }) => {
			// Show appropriate success message
			if (emailWarnings && emailWarnings.length > 0) {
				toast.warning(
					`Order placed successfully! ${emailWarnings.join(", ")}. Our team will contact you shortly.`,
					{ duration: 5000 },
				);
			} else {
				toast.success("Order placed and confirmation emails sent! 🎉", {
					duration: 3000,
				});
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
			};

			// Store in sessionStorage for the success page
			sessionStorage.setItem("orderSuccess", JSON.stringify(orderData));
			console.log("💾 Stored order data for success page:", orderId);

			// Small delay to ensure success message is seen, then redirect
			setTimeout(() => {
				console.log("🚀 Redirecting to order page:", orderId);
				// Clear the cart AFTER redirect to avoid showing "cart is empty"
				clearCart();
				window.location.href = `/order/${orderId}?new=true`;
			}, 1000);
		},
		onError: (error: Error) => {
			toast.error(error.message || "Failed to place order. Please try again.", {
				duration: 5000,
			});
		},
	});

	const isLoading = orderMutation.isPending;

	// Note: Removed product validation as it's handled by the enriched cart

	// Check if required fields are filled
	const isFormValid = useCallback(() => {
		const requiredFields = [
			"firstName",
			"lastName",
			"email",
			"phone",
			"streetAddress",
			"city",
			"country",
			"zipCode",
		];

		return requiredFields.every((field) =>
			customerInfo.shippingAddress[field as keyof Address]?.trim(),
		);
	}, [customerInfo.shippingAddress]);

	// Reset form error state when fields are filled
	useEffect(() => {
		if (showFormError && isFormValid()) {
			setShowFormError(false);
		}
	}, [isFormValid, showFormError]);

	// Handle button click with proper validation feedback
	const handleButtonClick = () => {
		if (!isFormValid()) {
			setShowFormError(true);
			// Reset error state after 3 seconds
			setTimeout(() => setShowFormError(false), 3000);

			// Use the existing form submit logic for validation and field focus
			const formElement = formRef.current;
			if (formElement) {
				formElement.requestSubmit();
			}
		} else if (cart.items.length === 0) {
			toast.error("Your cart is empty");
		} else {
			// If all validation passes, submit the form
			const formElement = formRef.current;
			if (formElement) {
				formElement.requestSubmit();
			}
		}
	};

	// Get dynamic button text with fun loading messages
	const getButtonText = () => {
		if (isLoading) {
			// Fun, descriptive loading messages
			const loadingMessages = [
				"✨ Sprinkling some magic on your order...",
				"🎨 Preparing your beautiful items...",
				"📦 Crafting your order with love...",
				"🚀 Launching your order into the world...",
				"💫 Working our creative magic...",
			];
			const randomMessage =
				loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
			return randomMessage;
		}
		if (showFormError) return "Please fill up the form";
		if (cart.items.length === 0) return "Cart is empty";
		return "Place Order";
	};

	// Get dynamic button variant based on state
	const getButtonVariant = () => {
		if (showFormError || cart.items.length === 0) return "destructive";
		return "default";
	};

	// Only redirect if cart is empty AND cart has been loaded AND order is not complete
	//   useEffect(() => {
	//     if (isCartLoaded && cart.items.length === 0 && !isOrderComplete) {
	//       router.push("/store");
	//     }
	//   }, [cart.items.length, router, isCartLoaded, isOrderComplete]);

	const handleAddressChange =
		(addressType: "shipping" | "billing") => (name: string, value: string) => {
			setCustomerInfo((prev) => ({
				...prev,
				[addressType === "shipping" ? "shippingAddress" : "billingAddress"]: {
					...(addressType === "shipping"
						? prev.shippingAddress
						: prev.billingAddress || prev.shippingAddress),
					[name]: value,
				},
			}));
		};

	const handleInputChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>,
	) => {
		const { name, value } = e.target;
		setCustomerInfo((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Combined field definitions with display names
		const requiredFields = {
			firstName: "First Name",
			lastName: "Last Name",
			email: "Email",
			phone: "Phone Number",
			streetAddress: "Street Address",
			city: "City",
			country: "Country",
			zipCode: "ZIP/Postal Code",
		} as const;

		const missingFields = Object.entries(requiredFields).filter(
			([field]) => !customerInfo.shippingAddress[field as keyof Address],
		);

		if (missingFields.length > 0) {
			// Trigger button error state
			setShowFormError(true);

			// Get the friendly names directly from the missingFields entries
			const missingFieldNames = missingFields.map(
				([, displayName]) => displayName,
			);

			toast.error(
				`Please fill in all required fields: ${missingFieldNames.join(", ")}`,
			);

			// Focus the first missing field using the form ref
			if (formRef.current) {
				const firstMissingFieldId = missingFields[0][0];
				const firstMissingField = formRef.current.querySelector(
					`input[name="${firstMissingFieldId}"]`,
				) as HTMLInputElement;

				if (firstMissingField) {
					firstMissingField.focus();
					firstMissingField.scrollIntoView({
						behavior: "smooth",
						block: "center",
					});
				}
			}

			// Reset error state after 3 seconds
			setTimeout(() => setShowFormError(false), 3000);
			return;
		}

		// If form is valid but cart is empty
		if (cart.items.length === 0) {
			toast.error("Your cart is empty");
			return;
		}

		// Get products from TanStack Query cache for server validation
		const storeData = queryClient.getQueryData(
			storeDataQueryOptions().queryKey,
		);
		const products = storeData?.products || [];

		// Use the mutation instead of manual fetch
		orderMutation.mutate({
			customerInfo,
			cartItems: enrichedItems,
			products: products as unknown as ProductWithVariations[], // Type assertion to resolve type mismatch
		});
	};

	// Calculate cart totals
	const subtotal = enrichedItems.reduce(
		(total, item) => total + item.price * item.quantity,
		0,
	);

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
				<h2 className="mb-4">Checkout</h2>
				<div className="flex flex-col lg:flex-row gap-8">
					{/* Customer Information Form - Left Side */}
					<div className="flex-1">
						<form ref={formRef} onSubmit={handleSubmit}>
							<p className="mb-8">
								You will be contacted regarding payment options after placing
								your order.
							</p>

							<div className="mb-8">
								<h2 className="!text-lg font-bold mb-4">Shipping Address</h2>
								<AddressFields
									values={customerInfo.shippingAddress}
									onChange={handleAddressChange("shipping")}
								/>
								<div className="mb-6">
									<div className="flex items-center space-x-2">
										<Checkbox
											checked={useSeparateBilling}
											onCheckedChange={(checked: boolean) => {
												setUseSeparateBilling(checked);
												if (checked && !customerInfo.billingAddress) {
													setCustomerInfo((prev) => ({
														...prev,
														billingAddress: { ...prev.shippingAddress },
													}));
												}
											}}
											className="form-checkbox"
											id={billingId}
										/>
										<label htmlFor={billingId} className="cursor-pointer">
											Use different billing address
										</label>
									</div>
								</div>
								{useSeparateBilling && (
									<div className="">
										<h3 className="mb-4">Billing Address</h3>
										<AddressFields
											values={
												customerInfo.billingAddress ||
												customerInfo.shippingAddress
											}
											onChange={handleAddressChange("billing")}
											required={useSeparateBilling}
										/>
									</div>
								)}
								<div className="mt-12">
									<h3 className=" mb-4">Additional Information</h3>
									<div className="mb-6">
										<h4 className="block text-sm font-medium mb-2">
											Shipping Method
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
												Standard Shipping
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
												Local Pickup
											</Button>
										</div>
									</div>
									<div className="mb-6">
										<label
											className="block text-sm font-medium mb-2"
											htmlFor={notesId}
										>
											Order Notes
										</label>
										<Textarea
											id={notesId}
											name="notes"
											value={customerInfo.notes}
											onChange={handleInputChange}
											rows={4}
											className="w-full p-2 border rounded-md"
											placeholder="Any special instructions for your order?"
										/>
									</div>
								</div>
							</div>
						</form>
					</div>
					{/* Order Summary - Right Side */}
					<div className="lg:w-[27rem] lg:sticky lg:top-4 lg:self-start">
						<NeumorphismCard className="">
							<h5>Summary</h5>
							<div className="flex justify-between items-baseline my-2">
								<span>Subtotal</span>
								<span>CA${subtotal.toFixed(2)}</span>
							</div>
							{totalDiscount > 0 && (
								<div className="flex justify-between items-baseline my-2 text-red-600">
									<span>Discount</span>
									<span>-CA${totalDiscount.toFixed(2)}</span>
								</div>
							)}
							<div className="flex justify-between items-baseline mb-4">
								<p>Shipping</p>
								<p className="text-right text-muted-foreground">
									To be discussed after order
								</p>
							</div>
							<div className="flex justify-between items-baseline text-xl mb-2 border-t pt-4">
								<span>Total</span>
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
								<h6>Order Items</h6>
								{enrichedItems.map((item) => (
									<div
										key={`${item.productId}-${item.variationId || "default"}`}
										className="flex items-start gap-3 py-2"
									>
										{/* Product image */}
										<div className="shrink-0 relative w-16 h-16 bg-muted rounded overflow-hidden">
											{item.image ? (
												<Image
													src={`/${item.image}`}
													alt={item.productName}
													className="object-cover"
												/>
											) : (
												<div className="w-full h-full flex items-center justify-center text-muted-foreground">
													No image
												</div>
											)}
										</div>
										{/* Product info */}
										<div className="grow">
											<Link
												href={`/store/${item.productId}`}
												className="blurLink"
												id={`product-${item.productId}`}
											>
												{item.productName}
											</Link>
											{item.attributes &&
												Object.keys(item.attributes).length > 0 && (
													<p className="text-sm text-muted-foreground">
														{Object.entries(item.attributes)
															.map(
																([key, value]) =>
																	`${getAttributeDisplayName(key)}: ${value}`,
															)
															.join(", ")}
													</p>
												)}
											<p className="text-sm text-muted-foreground">
												Quantity: {item.quantity}
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
															{item.discount}% OFF
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
						</NeumorphismCard>
					</div>
				</div>
			</div>
		</div>
	);
}
