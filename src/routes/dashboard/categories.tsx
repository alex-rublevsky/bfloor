import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { CategoryTreeView } from "~/components/ui/dashboard/CategoryTreeView";
import {
	DashboardEntityManager,
	type EntityFormFieldsProps,
	type EntityListProps,
} from "~/components/ui/dashboard/DashboardEntityManager";
import { ImageUpload } from "~/components/ui/dashboard/ImageUpload";
import { CategoriesPageSkeleton } from "~/components/ui/dashboard/skeletons/CategoriesPageSkeleton";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/shared/Select";
import { buildCategoryTree } from "~/lib/categoryTree";
import { categoriesQueryOptions } from "~/lib/queryOptions";
import { createProductCategory } from "~/server_functions/dashboard/categories/createProductCategory";
import { deleteProductCategory } from "~/server_functions/dashboard/categories/deleteProductCategory";
import { getAllProductCategories } from "~/server_functions/dashboard/categories/getAllProductCategories";
import { updateProductCategory } from "~/server_functions/dashboard/categories/updateProductCategory";
import type { Category, CategoryFormData } from "~/types";

// Category form fields component
const CategoryFormFields = ({
	formData,
	onFieldChange,
	idPrefix,
	entities = [],
	editingEntity,
}: EntityFormFieldsProps<Category, CategoryFormData>) => {
	const parentCategoryId = `${idPrefix}-parent-category`;

	return (
		<>
			{/* Parent Category Selector */}
			<div>
				<label
					htmlFor={parentCategoryId}
					className="block text-sm font-medium mb-1"
				>
					Родительская категория (опционально)
				</label>
				<Select
					value={(formData as CategoryFormData).parentSlug || "none"}
					onValueChange={(value: string) => {
						onFieldChange("parentSlug", value === "none" ? null : value);
					}}
				>
					<SelectTrigger id={parentCategoryId}>
						<SelectValue placeholder="Нет (корневая категория)" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="none">Нет (корневая категория)</SelectItem>
						{entities
							.filter(
								(cat) =>
									cat.isActive &&
									(!editingEntity || cat.slug !== editingEntity.slug),
							)
							.map((category) => (
								<SelectItem key={category.slug} value={category.slug}>
									{category.name}
								</SelectItem>
							))}
					</SelectContent>
				</Select>
			</div>

			{/* Image Upload */}
			<ImageUpload
				currentImages={(formData as CategoryFormData).image || ""}
				onImagesChange={(images) => onFieldChange("image", images)}
				folder="categories"
				slug={(formData as CategoryFormData).slug}
				productName={(formData as CategoryFormData).name}
			/>
		</>
	);
};

// Category list component
const CategoryList = ({
	entities,
	onEdit,
	onDelete,
}: EntityListProps<Category>) => {
	const categoryTree = useMemo(
		() => buildCategoryTree(entities || []),
		[entities],
	);

	return (
		<div className="border border-muted rounded-lg p-4 bg-card">
			<CategoryTreeView
				tree={categoryTree}
				onEdit={onEdit}
				onDelete={onDelete}
			/>
		</div>
	);
};

export const Route = createFileRoute("/dashboard/categories")({
	component: RouteComponent,
	pendingComponent: CategoriesPageSkeleton,

	// Loader prefetches data before component renders
	loader: async ({ context: { queryClient } }) => {
		// Ensure data is loaded before component renders
		await queryClient.ensureQueryData(categoriesQueryOptions());
	},
});

function RouteComponent() {
	// Use suspense queries - data is guaranteed to be loaded by the loader
	const { data: categoriesData } = useSuspenseQuery(
		categoriesQueryOptions(),
	);

	// Entity manager configuration
	const entityManagerConfig = {
		queryKey: ["bfloorCategories"],
		queryFn: getAllProductCategories,
		createFn: async (data: { data: CategoryFormData }) => {
			await createProductCategory({ data: data.data });
		},
		updateFn: async (data: { id: number; data: CategoryFormData }) => {
			await updateProductCategory({ data });
		},
		deleteFn: async (data: { id: number }) => {
			await deleteProductCategory({ data });
		},
		entityName: "категория",
		entityNamePlural: "категории",
		emptyStateEntityType: "categories",
		defaultFormData: {
			name: "",
			slug: "",
			parentSlug: null,
			image: "",
			isActive: true,
		} as CategoryFormData,
		formFields: CategoryFormFields,
		renderList: CategoryList,
	};

	return (
		<DashboardEntityManager
			config={entityManagerConfig}
			data={categoriesData || []}
		/>
	);
}
