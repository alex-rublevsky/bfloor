import { Input } from "~/components/ui/shared/input";
import { Switch } from "~/components/ui/shared/Switch";

interface ProductSettingsFieldsProps {
	isActive: boolean;
	isFeatured: boolean;
	discount: number | null;
	hasVariations: boolean;
	onIsActiveChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onIsFeaturedChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onDiscountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onHasVariationsChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	idPrefix: "edit" | "add";
}

export function ProductSettingsFields({
	isActive,
	isFeatured,
	discount,
	hasVariations,
	onIsActiveChange,
	onIsFeaturedChange,
	onDiscountChange,
	onHasVariationsChange,
	idPrefix,
}: ProductSettingsFieldsProps) {
	const isActiveId = `${idPrefix}IsActive`;
	const isFeaturedId = `${idPrefix}IsFeatured`;
	const discountId = `${idPrefix}Discount`;
	const hasVariationsId = `${idPrefix}HasVariations`;

	return (
		<div className="grid grid-cols-2 gap-4">
			<div className="flex items-center">
				<Switch
					id={isActiveId}
					name="isActive"
					checked={isActive}
					onChange={onIsActiveChange}
				/>
				<label htmlFor={isActiveId} className="ml-2 text-sm">
					Active
				</label>
			</div>

			<div className="flex items-center">
				<Switch
					id={isFeaturedId}
					name="isFeatured"
					checked={isFeatured}
					onChange={onIsFeaturedChange}
				/>
				<label htmlFor={isFeaturedId} className="ml-2 text-sm">
					Featured
				</label>
			</div>

			<div className="flex items-center space-x-2">
				<Input
					id={discountId}
					type="number"
					name="discount"
					value={discount || ""}
					onChange={onDiscountChange}
					placeholder="Discount %"
					min="0"
					max="100"
					className="w-20"
				/>
				<label htmlFor={discountId} className="text-sm whitespace-nowrap">
					% Off
				</label>
			</div>

			<div className="flex items-center">
				<Switch
					id={hasVariationsId}
					name="hasVariations"
					checked={hasVariations}
					onChange={onHasVariationsChange}
				/>
				<label htmlFor={hasVariationsId} className="ml-2 text-sm">
					Has Variations
				</label>
			</div>
		</div>
	);
}
