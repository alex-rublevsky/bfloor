import { Plus, Search } from "lucide-react";
import { Button } from "./Button";

interface EmptyStateProps {
	/** The type of entity that is empty (e.g., "brands", "collections", "products") */
	entityType: string;
	/** Whether this is a search result (shows different message) */
	isSearchResult?: boolean;
	/** Optional action button */
	actionButton?: {
		text: string;
		onClick: () => void;
	};
	/** Custom icon to display */
	icon?: React.ReactNode;
}

const entityTranslations: Record<
	string,
	{ singular: string; plural: string; genitive: string }
> = {
	brands: { singular: "бренд", plural: "бренды", genitive: "брендов" },
	collections: {
		singular: "коллекция",
		plural: "коллекции",
		genitive: "коллекций",
	},
	categories: {
		singular: "категория",
		plural: "категории",
		genitive: "категорий",
	},
	products: { singular: "товар", plural: "товары", genitive: "товаров" },
	orders: { singular: "заказ", plural: "заказы", genitive: "заказов" },
	attributes: {
		singular: "атрибут",
		plural: "атрибуты",
		genitive: "атрибутов",
	},
};

export function EmptyState({
	entityType,
	isSearchResult = false,
	actionButton,
	icon,
}: EmptyStateProps) {
	const entity = entityTranslations[entityType] || {
		singular: entityType,
		plural: entityType,
		genitive: entityType,
	};

	const defaultIcon = isSearchResult ? (
		<Search className="w-12 h-12 text-muted-foreground" />
	) : (
		<Plus className="w-12 h-12 text-muted-foreground" />
	);

	const title = isSearchResult
		? `Не найдено ${entity.genitive}`
		: `Пока нет ${entity.genitive}`;

	return (
		<div className="flex flex-col items-center justify-center py-16 px-4 text-center">
			{/* Icon */}
			<div className="mb-6">
				<div className="w-24 h-24 mx-auto bg-muted/30 rounded-full flex items-center justify-center">
					{icon || defaultIcon}
				</div>
			</div>

			{/* Title */}
			<h3 className="text-xl font-semibold text-foreground mb-6">{title}</h3>

			{/* Action Button */}
			{actionButton && (
				<Button onClick={actionButton.onClick} className="gap-2">
					<Plus className="w-4 h-4" />
					{actionButton.text}
				</Button>
			)}
		</div>
	);
}
