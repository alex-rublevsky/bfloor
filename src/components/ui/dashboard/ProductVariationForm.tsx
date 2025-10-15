import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { Button } from "~/components/ui/shared/Button";
import { Input } from "~/components/ui/shared/Input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/shared/Select";
import {
	getCountryFlag,
	getCountryName,
	SHIPPING_COUNTRIES,
} from "~/constants/countries";
import {
	getAttributeDisplayName,
	PRODUCT_ATTRIBUTES,
} from "~/lib/productAttributes";

// Define the Variation type since it's not exported from @/types
interface Variation {
	id: string;
	sku: string;
	price: number;
	stock: number;
	discount?: number | null; // Add discount field
	sort: number;
	shippingFrom?: string; // Country code for shipping origin
	attributes: VariationAttribute[];
}

interface VariationAttribute {
	attributeId: string;
	value: string;
}

interface ProductVariationFormProps {
	variations: Variation[];
	onChange: (variations: Variation[]) => void;
}

// Sortable variation item component
function SortableVariationItem({
	variation,
	onRemove,
	onUpdate,
	onAddAttribute,
	onRemoveAttribute,
	onUpdateAttributeValue,
	unusedAttributes,
}: {
	variation: Variation;
	onRemove: (id: string) => void;
	onUpdate: (
		id: string,
		field: keyof Variation,
		value: string | number | null,
	) => void;
	onAddAttribute: (variationId: string, attributeId: string) => void;
	onRemoveAttribute: (variationId: string, attributeId: string) => void;
	onUpdateAttributeValue: (
		variationId: string,
		attributeId: string,
		value: string,
	) => void;
	unusedAttributes: string[];
}) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: variation.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	const [selectedAttribute, setSelectedAttribute] = useState("");

	const handleAddAttributeClick = () => {
		if (selectedAttribute) {
			onAddAttribute(variation.id, selectedAttribute);
			setSelectedAttribute("");
		}
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...listeners}
			className="relative border border-border rounded-md p-3 bg-background space-y-3 cursor-grab active:cursor-grabbing"
		>
			{/* First row: SKU with Remove button */}
			<div className="flex gap-1 items-end">
				<div className="flex-1">
					<Input
						id={`sku-${variation.id}`}
						type="text"
						label="SKU"
						value={variation.sku}
						onChange={(e) => onUpdate(variation.id, "sku", e.target.value)}
						onPointerDown={(e) => e.stopPropagation()}
						className="text-sm"
					/>
				</div>
				<Button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						onRemove(variation.id);
					}}
					onPointerDown={(e) => e.stopPropagation()}
					variant="destructive"
					size="sm"
					className="bg-destructive/20 hover:bg-destructive/90 shrink-0"
				>
					Remove
				</Button>
			</div>

			{/* Second row: Price, Discount, Stock, Country */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-2">
				<div>
					<Input
						id={`price-${variation.id}`}
						type="number"
						label="Price"
						value={variation.price === 0 ? "" : variation.price}
						onChange={(e) => {
							const value = e.target.value;
							const numericValue = value === "" ? 0 : parseFloat(value) || 0;
							onUpdate(variation.id, "price", numericValue);
						}}
						onPointerDown={(e) => e.stopPropagation()}
						className="text-sm"
						placeholder="0"
					/>
				</div>

				<div>
					<Input
						id={`discount-${variation.id}`}
						type="number"
						label="Discount %"
						value={variation.discount || ""}
						onChange={(e) => {
							const value = e.target.value;
							const numericValue =
								value === "" ? null : parseInt(value, 10) || null;
							onUpdate(variation.id, "discount", numericValue);
						}}
						onPointerDown={(e) => e.stopPropagation()}
						placeholder="0"
						min="0"
						max="100"
						className="text-sm"
					/>
				</div>

				<div>
					<Input
						id={`stock-${variation.id}`}
						type="number"
						label="Stock"
						value={variation.stock === 0 ? "" : variation.stock}
						onChange={(e) => {
							const value = e.target.value;
							const numericValue = value === "" ? 0 : parseInt(value, 10) || 0;
							onUpdate(variation.id, "stock", numericValue);
						}}
						onPointerDown={(e) => e.stopPropagation()}
						className="text-sm"
						placeholder="0"
					/>
				</div>

				<div className="w-20">
					<label
						htmlFor={`shipping-${variation.id}`}
						className="block text-xs text-muted-foreground mb-1"
					>
						Ships From
					</label>
					<Select
						value={variation.shippingFrom || "NONE"}
						onValueChange={(value) =>
							onUpdate(
								variation.id,
								"shippingFrom",
								value === "NONE" ? null : value,
							)
						}
					>
						<SelectTrigger
							id={`shipping-${variation.id}`}
							className="text-sm w-20"
							onPointerDown={(e) => e.stopPropagation()}
						>
							<SelectValue placeholder="Country">
								{getCountryFlag(variation.shippingFrom || undefined) || ""}
							</SelectValue>
						</SelectTrigger>
						<SelectContent>
							{SHIPPING_COUNTRIES.map((code) => (
								<SelectItem key={code} value={code}>
									{getCountryName(code)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* Attributes section */}
			<div>
				<div className="block text-sm font-medium text-foreground mb-2">
					Attributes
				</div>
				<div className="grid grid-cols-2 gap-2">
					{variation.attributes.map((attr) => (
						<div key={attr.attributeId} className="flex items-center gap-1">
							<div className="flex-1">
								<Input
									id={`attr-${variation.id}-${attr.attributeId}`}
									type="text"
									label={getAttributeDisplayName(attr.attributeId)}
									value={attr.value}
									onChange={(e) =>
										onUpdateAttributeValue(
											variation.id,
											attr.attributeId,
											e.target.value,
										)
									}
									onPointerDown={(e) => e.stopPropagation()}
									placeholder="Value"
									className="text-sm"
								/>
							</div>
							<Button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									onRemoveAttribute(variation.id, attr.attributeId);
								}}
								onPointerDown={(e) => e.stopPropagation()}
								variant="destructive"
								size="icon"
								className="h-8 w-8 shrink-0 bg-destructive/20 hover:bg-destructive/90 mt-5"
							>
								×
							</Button>
						</div>
					))}

					{/* Add attribute section - takes up grid cell */}
					{unusedAttributes.length > 0 && (
						<div className="flex items-end gap-1">
							<Select
								value={selectedAttribute}
								onValueChange={setSelectedAttribute}
							>
								<SelectTrigger
									id={`add-attr-${variation.id}`}
									className="text-sm flex-1"
									onPointerDown={(e) => e.stopPropagation()}
								>
									<SelectValue placeholder="Add attribute..." />
								</SelectTrigger>
								<SelectContent>
									{unusedAttributes.map((attr) => (
										<SelectItem key={attr} value={attr}>
											{getAttributeDisplayName(attr)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									handleAddAttributeClick();
								}}
								onPointerDown={(e) => e.stopPropagation()}
								disabled={!selectedAttribute}
								size="sm"
								className="shrink-0"
							>
								Add
							</Button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

export default function ProductVariationForm({
	variations,
	onChange,
}: ProductVariationFormProps) {
	const [availableAttributes] = useState<string[]>(
		Object.values(PRODUCT_ATTRIBUTES).map((attr) => attr.id),
	);

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		if (over && active.id !== over.id) {
			const oldIndex = variations.findIndex((item) => item.id === active.id);
			const newIndex = variations.findIndex((item) => item.id === over.id);

			const newVariations = arrayMove(variations, oldIndex, newIndex).map(
				(item, index) => ({
					...item,
					sort: index,
				}),
			);

			onChange(newVariations);
		}
	};

	const handleAddVariation = () => {
		const newVariation: Variation = {
			id: `temp-${Date.now()}`,
			sku: "",
			price: 0,
			stock: 0,
			discount: null,
			sort: variations.length,
			shippingFrom: undefined,
			attributes: [],
		};
		onChange([...variations, newVariation]);
	};

	const handleRemoveVariation = (id: string) => {
		onChange(variations.filter((variation) => variation.id !== id));
	};

	const handleUpdateVariation = (
		id: string,
		field: keyof Variation,
		value: string | number | null,
	) => {
		onChange(
			variations.map((variation) =>
				variation.id === id ? { ...variation, [field]: value } : variation,
			),
		);
	};

	const handleAddAttribute = (variationId: string, attributeId: string) => {
		onChange(
			variations.map((variation) => {
				if (variation.id === variationId) {
					// Check if attribute already exists
					const attributeExists = variation.attributes.some(
						(attr) => attr.attributeId === attributeId,
					);

					if (!attributeExists) {
						return {
							...variation,
							attributes: [...variation.attributes, { attributeId, value: "" }],
						};
					}
				}
				return variation;
			}),
		);
	};

	const handleRemoveAttribute = (variationId: string, attributeId: string) => {
		onChange(
			variations.map((variation) => {
				if (variation.id === variationId) {
					return {
						...variation,
						attributes: variation.attributes.filter(
							(attr) => attr.attributeId !== attributeId,
						),
					};
				}
				return variation;
			}),
		);
	};

	const handleUpdateAttributeValue = (
		variationId: string,
		attributeId: string,
		value: string,
	) => {
		onChange(
			variations.map((variation) => {
				if (variation.id === variationId) {
					return {
						...variation,
						attributes: variation.attributes.map((attr) =>
							attr.attributeId === attributeId ? { ...attr, value } : attr,
						),
					};
				}
				return variation;
			}),
		);
	};

	// Get unused attributes for a specific variation
	const getUnusedAttributes = (variation: Variation) => {
		const usedAttributeIds = variation.attributes.map(
			(attr) => attr.attributeId,
		);
		return availableAttributes.filter(
			(attr) => !usedAttributeIds.includes(attr),
		);
	};

	return (
		<div className="space-y-4">
			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragEnd={handleDragEnd}
			>
				<SortableContext
					items={variations.map((item) => item.id)}
					strategy={verticalListSortingStrategy}
				>
					{/* Two column layout for variations on large screens */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
						{variations.map((variation) => (
							<SortableVariationItem
								key={variation.id}
								variation={variation}
								onRemove={handleRemoveVariation}
								onUpdate={handleUpdateVariation}
								onAddAttribute={handleAddAttribute}
								onRemoveAttribute={handleRemoveAttribute}
								onUpdateAttributeValue={handleUpdateAttributeValue}
								unusedAttributes={getUnusedAttributes(variation)}
							/>
						))}
					</div>
				</SortableContext>
			</DndContext>

			<Button type="button" onClick={handleAddVariation}>
				Add Variation
			</Button>
		</div>
	);
}
