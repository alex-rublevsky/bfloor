import { X } from "lucide-react";
import { DrawerSection } from "~/components/ui/dashboard/DrawerSection";
import { Button } from "~/components/ui/shared/Button";
import {
	Drawer,
	DrawerBody,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
} from "~/components/ui/shared/Drawer";
import { Image } from "~/components/ui/shared/Image";

interface OrderAddress {
	id: number;
	orderId: number;
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	streetAddress: string;
	city: string;
	state: string | null;
	country: string;
	zipCode: string;
	addressType: string;
	createdAt: Date;
}

interface OrderItem {
	id: number;
	orderId: number;
	productId: number;
	quantity: number;
	unitAmount: number;
	finalAmount: number;
	discountPercentage: number | null;
	product: {
		name: string;
		images: string | null;
	};
	variation?: {
		id: number;
		sku: string;
	};
	attributes?: Record<string, string>;
}

interface Order {
	id: number;
	status: string;
	subtotalAmount: number;
	discountAmount: number;
	shippingAmount: number;
	totalAmount: number;
	currency: string;
	paymentMethod: string | null;
	paymentStatus: string;
	shippingMethod: string | null;
	notes: string | null;
	createdAt: Date;
	completedAt: Date | null;
	addresses: OrderAddress[];
	items: OrderItem[];
}

interface OrderDrawerProps {
	order: Order | null;
	isOpen: boolean;
	onClose: () => void;
}

export function OrderDrawer({ order, isOpen, onClose }: OrderDrawerProps) {
	if (!order) return null;

	const shippingAddress = order.addresses?.find(
		(addr) => addr.addressType === "shipping" || addr.addressType === "both",
	);
	const billingAddress = order.addresses?.find(
		(addr) => addr.addressType === "billing",
	);

	return (
		<Drawer open={isOpen} onOpenChange={onClose}>
			<DrawerContent width="full">
				<DrawerHeader className="px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between">
						<DrawerTitle>Order #{order.id}</DrawerTitle>
						<Button variant="ghost" size="icon" onClick={onClose}>
							<X className="h-5 w-5" />
						</Button>
					</div>
					<p className="text-sm text-muted-foreground">
						Placed on {new Date(order.createdAt).toLocaleDateString()}
					</p>
				</DrawerHeader>

				<DrawerBody className="w-full p-0">
					<div className="space-y-6">
						{/* Payment Details */}
						<DrawerSection title="Payment Details">
							<div className="space-y-2">
								<p className="text-sm">
									<span className="font-medium">Subtotal:</span>{" "}
									{order.currency} {order.subtotalAmount.toFixed(2)}
								</p>
								{order.discountAmount > 0 && (
									<p className="text-sm">
										<span className="font-medium">Discount:</span> -
										{order.currency} {order.discountAmount.toFixed(2)}
									</p>
								)}
								{order.shippingAmount > 0 && (
									<p className="text-sm">
										<span className="font-medium">Shipping:</span>{" "}
										{order.currency} {order.shippingAmount.toFixed(2)}
									</p>
								)}
								<p className="text-sm font-semibold">
									<span className="font-medium">Total:</span> {order.currency}{" "}
									{order.totalAmount.toFixed(2)}
								</p>
								<p className="text-sm">
									<span className="font-medium">Status:</span>{" "}
									{order.paymentStatus}
								</p>
								{order.paymentMethod && (
									<p className="text-sm">
										<span className="font-medium">Method:</span>{" "}
										{order.paymentMethod}
									</p>
								)}
							</div>
						</DrawerSection>

						{/* Shipping Details */}
						<DrawerSection title="Shipping Details">
							<div className="space-y-2">
								<p className="text-sm">
									<span className="font-medium">Status:</span> {order.status}
								</p>
								{order.shippingMethod && (
									<p className="text-sm">
										<span className="font-medium">Method:</span>{" "}
										{order.shippingMethod}
									</p>
								)}
								{order.notes && (
									<p className="text-sm">
										<span className="font-medium">Notes:</span> {order.notes}
									</p>
								)}
							</div>
						</DrawerSection>

						{/* Shipping Address */}
						{shippingAddress && (
							<DrawerSection title="Shipping Address">
								<div className="space-y-2">
									<p className="text-sm">
										{shippingAddress.firstName} {shippingAddress.lastName}
									</p>
									<p className="text-sm">{shippingAddress.streetAddress}</p>
									<p className="text-sm">
										{shippingAddress.city}, {shippingAddress.state}{" "}
										{shippingAddress.zipCode}
									</p>
									<p className="text-sm">{shippingAddress.country}</p>
									<p className="text-sm">{shippingAddress.email}</p>
									<p className="text-sm">{shippingAddress.phone}</p>
								</div>
							</DrawerSection>
						)}

						{/* Billing Address */}
						{billingAddress && (
							<DrawerSection title="Billing Address">
								<div className="space-y-2">
									<p className="text-sm">
										{billingAddress.firstName} {billingAddress.lastName}
									</p>
									<p className="text-sm">{billingAddress.streetAddress}</p>
									<p className="text-sm">
										{billingAddress.city}, {billingAddress.state}{" "}
										{billingAddress.zipCode}
									</p>
									<p className="text-sm">{billingAddress.country}</p>
									<p className="text-sm">{billingAddress.email}</p>
									<p className="text-sm">{billingAddress.phone}</p>
								</div>
							</DrawerSection>
						)}

						{/* Order Items */}
						{order.items && order.items.length > 0 && (
							<DrawerSection title="Items">
								<div className="space-y-4">
									{order.items.map((item) => (
										<div key={item.id} className="flex items-center gap-4">
											<div className="relative w-16 h-16 shrink-0 bg-muted rounded overflow-hidden">
												{item.product.images ? (
													<Image
														src={`/${item.product.images.split(",").map((img) => img.trim())[0]}`}
														alt={item.product.name}
														className="object-cover"
														sizes="4rem"
													/>
												) : (
													<div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
														No image
													</div>
												)}
											</div>
											<div className="flex-1">
												<p className="font-medium">{item.product.name}</p>
												{item.variation?.sku && (
													<p className="text-sm text-muted-foreground">
														SKU: {item.variation.sku}
													</p>
												)}
												{item.attributes &&
													Object.keys(item.attributes).length > 0 && (
														<p className="text-sm text-muted-foreground">
															{Object.entries(item.attributes)
																.map(([key, value]) => `${key}: ${value}`)
																.join(", ")}
														</p>
													)}
												<p className="text-sm text-muted-foreground">
													Qty: {item.quantity} × ${item.unitAmount.toFixed(2)}
												</p>
											</div>
											<p className="font-semibold">
												${item.finalAmount.toFixed(2)}
											</p>
										</div>
									))}
								</div>
							</DrawerSection>
						)}
					</div>
				</DrawerBody>
			</DrawerContent>
		</Drawer>
	);
}
