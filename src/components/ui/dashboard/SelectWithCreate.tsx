import { useCallback, useState } from "react";
import { toast } from "sonner";
import { SlugField } from "~/components/ui/dashboard/SlugField";
import { Button } from "~/components/ui/shared/Button";
import { Input } from "~/components/ui/shared/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/shared/Select";
import { Switch } from "~/components/ui/shared/Switch";
import { BRAND_COUNTRIES, getBrandCountryName } from "~/constants/units";
import { useSlugGeneration } from "~/hooks/useSlugGeneration";
import { createBrand } from "~/server_functions/dashboard/brands/createBrand";
import { createProductCategory } from "~/server_functions/dashboard/categories/createProductCategory";
import { createCollection } from "~/server_functions/dashboard/collections/createCollection";
import type {
	Brand,
	BrandFormData,
	Category,
	CategoryFormData,
	Collection,
	CollectionFormData,
} from "~/types";

interface SelectWithCreateProps {
	value: string | null;
	onValueChange: (value: string | null) => void;
	placeholder: string;
	label: string;
	required?: boolean;
	className?: string;
	id?: string;
	entityType: "category" | "brand" | "collection";
	options: (Category | Brand | Collection)[];
	brands?: Brand[]; // For collections to select from brands
	onEntityCreated?: (entity: Category | Brand | Collection) => void;
}

export function SelectWithCreate({
	value,
	onValueChange,
	placeholder,
	label,
	required = false,
	className,
	id,
	entityType,
	options,
	brands,
	onEntityCreated,
}: SelectWithCreateProps) {
	const [isCreating, setIsCreating] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isAutoSlug, setIsAutoSlug] = useState(true);

	// Form data for different entity types
	const [formData, setFormData] = useState<
		CategoryFormData | BrandFormData | CollectionFormData
	>({
		name: "",
		slug: "",
		isActive: true,
		...(entityType === "category" && { parentSlug: null, image: "", order: 0 }),
		...(entityType === "brand" && { logo: "", country: "" }),
		...(entityType === "collection" && { brandSlug: "" }),
	} as CategoryFormData | BrandFormData | CollectionFormData);

	// Slug generation
	const handleSlugChange = useCallback((slug: string) => {
		setFormData((prev) => ({ ...prev, slug }));
	}, []);

	useSlugGeneration(formData.name, isAutoSlug, handleSlugChange);

	const handleCreate = async () => {
		if (!formData.name.trim()) {
			toast.error("Название обязательно");
			return;
		}

		if (!formData.slug.trim()) {
			toast.error("Slug обязателен");
			return;
		}

		// Additional validation for collections
		if (
			entityType === "collection" &&
			!(formData as CollectionFormData).brandSlug
		) {
			toast.error("Бренд обязателен для коллекции");
			return;
		}

		setIsSubmitting(true);
		try {
			let result: {
				category?: Category;
				brand?: Brand;
				collection?: Collection;
			};

			switch (entityType) {
				case "category":
					result = await createProductCategory({
						data: formData as CategoryFormData,
					});
					break;
				case "brand":
					result = await createBrand({
						data: {
							name: (formData as BrandFormData).name,
							slug: (formData as BrandFormData).slug,
							logo: (formData as BrandFormData).logo || "",
							country: (formData as BrandFormData).country || "",
							isActive: (formData as BrandFormData).isActive,
						},
					});
					break;
				case "collection":
					result = await createCollection({
						data: {
							data: formData as CollectionFormData,
						},
					});
					break;
				default:
					throw new Error("Неизвестный тип сущности");
			}

			toast.success(
				`${entityType === "category" ? "Категория" : entityType === "brand" ? "Бренд" : "Коллекция"} создана успешно!`,
			);

			// Debug: Log the result to see the structure
			console.log("Creation result:", result);

			// Reset form
			setFormData({
				name: "",
				slug: "",
				isActive: true,
				...(entityType === "category" && {
					parentSlug: null,
					image: "",
					order: 0,
				}),
				...(entityType === "brand" && { logo: "", country: "" }),
				...(entityType === "collection" && { brandSlug: "" }),
			} as CategoryFormData | BrandFormData | CollectionFormData);

			setIsAutoSlug(true);
			setIsCreating(false);

			// Select the newly created entity
			let newEntity: Category | Brand | Collection | undefined;
			switch (entityType) {
				case "category":
					newEntity = result.category;
					break;
				case "brand":
					newEntity = result.brand;
					break;
				case "collection":
					newEntity = result.collection;
					break;
			}

			if (newEntity) {
				console.log("Selecting new entity:", newEntity.slug);
				// Call the entity created callback first to refresh the options
				onEntityCreated?.(newEntity);
				// Then select the new entity after a small delay to ensure options are updated
				setTimeout(() => {
					onValueChange(newEntity.slug);
				}, 100);
			} else {
				console.log("No new entity found in result:", result);
			}
		} catch (error) {
			const errorMsg =
				error instanceof Error ? error.message : "Ошибка при создании";
			toast.error(errorMsg);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleCancel = () => {
		setIsCreating(false);
		setFormData({
			name: "",
			slug: "",
			isActive: true,
			...(entityType === "category" && {
				parentSlug: null,
				image: "",
				order: 0,
			}),
			...(entityType === "brand" && { logo: "", country: "" }),
			...(entityType === "collection" && { brandSlug: "" }),
		} as CategoryFormData | BrandFormData | CollectionFormData);
		setIsAutoSlug(true);
	};

	return (
		<div className="space-y-2">
			<label htmlFor={id} className="block text-sm font-medium mb-1">
				{label}
			</label>

			<Select
				value={value || "none"}
				onValueChange={(newValue) => {
					if (newValue === "create-new") {
						setIsCreating(true);
					} else {
						onValueChange(newValue === "none" ? null : newValue);
					}
				}}
				required={required}
			>
				<SelectTrigger id={id} className={className}>
					<SelectValue placeholder={placeholder} />
				</SelectTrigger>
				<SelectContent>
					{entityType !== "category" && (
						<SelectItem value="none">
							{entityType === "brand" ? "Нет" : "Нет"}
						</SelectItem>
					)}
					{options.map((option) => (
						<SelectItem key={option.slug} value={option.slug}>
							{option.name}
						</SelectItem>
					))}
					<SelectItem value="create-new" className="text-primary font-medium">
						+ Создать новый{" "}
						{entityType === "category"
							? "категорию"
							: entityType === "brand"
								? "бренд"
								: "коллекцию"}
					</SelectItem>
				</SelectContent>
			</Select>

			{/* Inline creation form */}
			{isCreating && (
				<div className="mt-4 p-4 border rounded-lg bg-muted/30 space-y-4">
					<h5 className="font-medium text-xs text-muted-foreground">
						Создать новый{" "}
						{entityType === "category"
							? "категорию"
							: entityType === "brand"
								? "бренд"
								: "коллекцию"}
					</h5>

					<div className="space-y-3">
						<Input
							label="Название"
							type="text"
							value={formData.name}
							onChange={(e) =>
								setFormData((prev) => ({ ...prev, name: e.target.value }))
							}
							placeholder={`Название ${entityType === "category" ? "категории" : entityType === "brand" ? "бренда" : "коллекции"}`}
							required
						/>

						<SlugField
							slug={formData.slug}
							name={formData.name}
							isAutoSlug={isAutoSlug}
							onSlugChange={(slug) => {
								setIsAutoSlug(false);
								setFormData((prev) => ({ ...prev, slug }));
							}}
							onAutoSlugChange={setIsAutoSlug}
							idPrefix={`create-${entityType}-`}
						/>

						{/* Country selection for brands */}
						{entityType === "brand" && (
							<div>
								<label
									htmlFor={`${entityType}-country`}
									className="block text-sm font-medium mb-1"
								>
									Страна
								</label>
								<select
									id={`${entityType}-country`}
									value={(formData as BrandFormData).country || ""}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											country: e.target.value || undefined,
										}))
									}
									className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
								>
									{BRAND_COUNTRIES.map((countryCode) => (
										<option
											key={countryCode}
											value={countryCode === "NONE" ? "" : countryCode}
										>
											{getBrandCountryName(
												countryCode === "NONE" ? "" : countryCode,
											)}
										</option>
									))}
								</select>
							</div>
						)}

						{/* Brand selection for collections */}
						{entityType === "collection" && (
							<div>
								<label
									htmlFor={`${entityType}-brand`}
									className="block text-sm font-medium mb-1"
								>
									Бренд <span className="text-red-500">*</span>
								</label>
								<Select
									value={(formData as CollectionFormData).brandSlug}
									onValueChange={(brandSlug) =>
										setFormData((prev) => ({ ...prev, brandSlug }))
									}
									required
								>
									<SelectTrigger id={`${entityType}-brand`}>
										<SelectValue placeholder="Выберите бренд" />
									</SelectTrigger>
									<SelectContent>
										{(brands || []).map((brand) => (
											<SelectItem key={brand.slug} value={brand.slug}>
												{brand.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						)}

						<div className="flex items-center gap-2">
							<Switch
								id={`${entityType}-isActive`}
								checked={formData.isActive}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										isActive: e.target.checked,
									}))
								}
							/>
							<label htmlFor={`${entityType}-isActive`} className="text-sm">
								Активен
							</label>
						</div>
					</div>

					<div className="flex gap-2">
						<Button
							type="button"
							onClick={handleCreate}
							disabled={isSubmitting}
							size="sm"
						>
							{isSubmitting ? "Создание..." : "Создать"}
						</Button>
						<Button
							type="button"
							variant="outline"
							onClick={handleCancel}
							disabled={isSubmitting}
							size="sm"
						>
							Отмена
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
