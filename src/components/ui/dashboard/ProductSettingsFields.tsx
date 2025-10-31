import { Switch } from "~/components/ui/shared/Switch";

interface ProductSettingsFieldsProps {
	isActive: boolean;
	isFeatured: boolean;
	hasVariations: boolean;
	onIsActiveChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onIsFeaturedChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onHasVariationsChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	idPrefix: "edit" | "add";
}

export function ProductSettingsFields({
	isActive,
	isFeatured,
	hasVariations,
	onIsActiveChange,
	onIsFeaturedChange,
	onHasVariationsChange,
	idPrefix,
}: ProductSettingsFieldsProps) {
	const isActiveId = `${idPrefix}IsActive`;
	const isFeaturedId = `${idPrefix}IsFeatured`;
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
					Активен
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
					Рекомендуемый
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
					Есть варианты
				</label>
			</div>
		</div>
	);
}
