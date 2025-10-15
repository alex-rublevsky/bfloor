import {
	Body,
	Button,
	Column,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Img,
	Link,
	Preview,
	Row,
	Section,
	Tailwind,
	Text,
} from "@react-email/components";

interface ClientOrderConfirmationProps {
	userImage?: string;
	Name?: string;
	LastName?: string;
	orderId?: string;
	subtotal?: string;
	totalDiscount?: string;
	orderTotal?: string;
	orderItems?: Array<{
		name: string;
		quantity: number;
		price: string;
		originalPrice: string;
		discount?: number;
		image?: string;
	}>;
}

export const ClientOrderConfirmation = ({
	Name,
	LastName,
	orderId,
	subtotal,
	totalDiscount,
	orderTotal,
	orderItems = [],
}: ClientOrderConfirmationProps) => {
	const previewText = `Order Confirmation from Rublevsky Studio`;

	return (
		<Html>
			<Head />
			<Tailwind>
				<Body className="bg-white my-auto mx-auto font-sans px-2">
					<Preview>{previewText}</Preview>
					<Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[10px] max-w-[465px]">
						<Section className="mt-[32px]">
							<Img
								src={
									"https://assets.rublevsky.studio/logos/rublevsky-studio.svg"
								}
								width="40"
								height="37"
								alt="Rublevsky Studio"
								className="my-0 mx-auto"
							/>
						</Section>
						<Heading className="text-foreground text-[24px] font-normal text-center p-0 my-[30px] mx-0">
							Your order has been placed successfully!
						</Heading>
						<Text className="text-foreground text-[14px] leading-[15px]">
							Greetings, {Name} {LastName}!
						</Text>
						<Text className="text-foreground text-[14px] leading-[15px]">
							You will be contacted shortly regarding delivery and payment.
						</Text>

						<Section className="py-[8px] text-center">
							<table className="mb-[16px] w-full">
								{orderItems.map((item, index) => (
									<tr key={`${item.name}-${index}`}>
										<td className="border-0 border-b border-solid border-gray-200 py-[8px] w-[80px]">
											{item.image ? (
												<Img
													alt={item.name}
													className="rounded-[8px] object-cover"
													width={80}
													src={item.image}
												/>
											) : null}
										</td>
										<td
											align="left"
											className="border-0 border-b border-solid border-gray-200 py-[8px] px-4"
										>
											<Text>{item.name}</Text>
										</td>
										<td
											align="right"
											className="border-0 border-b border-solid border-gray-200 py-[8px] w-auto"
										>
											{item.discount ? (
												<div className="space-y-0 text-right">
													<Text className="text-sm">
														<span className="text-red-600 font-medium">
															-{item.discount}%
														</span>{" "}
														<span className="line-through text-gray-500">
															CA${item.originalPrice}
														</span>
													</Text>
													<Text className="text-foreground text-lg leading-[15px]">
														CA${item.price}
													</Text>
													<Text className="text-sm text-gray-500">
														Quantity: {item.quantity}
													</Text>
												</div>
											) : (
												<div className="space-y-0 text-right">
													<Text className="text-foreground text-lg leading-[15px]">
														CA${item.price}
													</Text>
													<Text className="text-sm text-gray-500">
														Quantity: {item.quantity}
													</Text>
												</div>
											)}
										</td>
									</tr>
								))}
							</table>
							<Row>
								<Column align="right" className="w-full px-[12px]">
									<Text className="text-gray-600">Subtotal: CA${subtotal}</Text>
									{Number(totalDiscount) > 0 && (
										<Text className="text-red-600">
											Discount: -CA${totalDiscount}
										</Text>
									)}
									<Text className="font-semibold text-lg mt-2">
										Total: CA${orderTotal}
									</Text>
								</Column>
							</Row>
							<Row>
								<Column align="center">
									<Button
										className="box-border w-full rounded-[8px] bg-primary px-[12px] py-[12px] text-center font-normal text-primary-foreground"
										href={`https://www.rublevsky.studio/order/${orderId}`}
									>
										View Order
									</Button>
								</Column>
							</Row>
						</Section>

						<Text className="text-gray-400 text-[14px] leading-[24px]">
							or copy and paste this URL into your browser:{" "}
							<Link
								href={`https://www.rublevsky.studio/order/${orderId}`}
								className="text-blue-400 no-underline"
							>
								{`https://www.rublevsky.studio/order/${orderId}`}
							</Link>
						</Text>
						<Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
						<Text className="text-[#666666] text-[12px] leading-[22px]">
							This order confirmation was intended for{" "}
							<span className="text-foreground">{Name}</span>. This email was
							sent from{" "}
							<span className="text-foreground">Rublevsky Studio</span> located
							in <span className="text-foreground">Ontario, Canada</span>. If
							you were not expecting this order confirmation, you can ignore
							this email. If you are concerned about your account's safety,
							please reply to this email to get in touch with us.
						</Text>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
};

ClientOrderConfirmation.PreviewProps = {
	username: "alanturing",
	Name: "Alan",
	LastName: "Turing",
	orderId: "1234567890",
	subtotal: "250.00",
	totalDiscount: "45.00",
	orderTotal: "205.00",
	orderItems: [
		{
			name: "Red Graffiti Print",
			quantity: 1,
			price: "120.00",
			image: "https://assets.rublevsky.studio/red-graffiti-1.webp",
		},
		{
			name: "Blue Abstract Print",
			quantity: 2,
			price: "63.75",
			originalPrice: "75.00",
			discount: 15,
			image: "https://assets.rublevsky.studio/yin-yang-shirt-7.webp",
		},
	],
} as ClientOrderConfirmationProps;

export default ClientOrderConfirmation;
