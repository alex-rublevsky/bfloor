import { createFileRoute } from "@tanstack/react-router";
import {
	DashboardEntityManager,
	type EntityListProps,
} from "~/components/ui/dashboard/DashboardEntityManager";
import { EntityCardGrid } from "~/components/ui/dashboard/EntityCardGrid";
import { useProductAttributes } from "~/hooks/useProductAttributes";
import { createProductAttribute } from "~/server_functions/dashboard/attributes/createProductAttribute";
import { deleteProductAttribute } from "~/server_functions/dashboard/attributes/deleteProductAttribute";
import { updateProductAttribute } from "~/server_functions/dashboard/attributes/updateProductAttribute";
import type { ProductAttribute } from "~/types";

// Attribute form fields component (minimal for attributes)
const AttributeFormFields = () => {
	// Attributes only need name and slug, no additional fields
	return null;
};

// Attribute list component using the meta component
const AttributeList = ({
	entities,
	onEdit,
	onDelete,
}: EntityListProps<ProductAttribute>) => (
	<EntityCardGrid
		entities={entities}
		onEdit={onEdit}
		onDelete={onDelete}
		renderEntity={(attribute) => (
			<div className="flex flex-col flex-1 min-w-0">
				<div className="flex items-center gap-2">
					<span className="text-sm font-medium truncate">{attribute.name}</span>
				</div>
				<span className="text-xs text-muted-foreground truncate">
					{attribute.slug}
				</span>
			</div>
		)}
	/>
);

export const Route = createFileRoute("/dashboard/attributes")({
	component: AttributesPage,
});

function AttributesPage() {
	const { data: attributes } = useProductAttributes();

	// Entity manager configuration
	const entityManagerConfig = {
		queryKey: ["productAttributes"],
		queryFn: async () => attributes || [],
		createFn: async (data: {
			data: { name: string; slug: string; isActive: boolean };
		}) => {
			await createProductAttribute({
				data: { name: data.data.name, slug: data.data.slug },
			});
		},
		updateFn: async (data: {
			id: number;
			data: { name: string; slug: string; isActive: boolean };
		}) => {
			await updateProductAttribute({
				data: {
					id: data.id,
					data: { name: data.data.name, slug: data.data.slug },
				},
			});
		},
		deleteFn: async (data: { id: number }) => {
			await deleteProductAttribute({ data });
		},
		entityName: "атрибут",
		entityNamePlural: "атрибуты",
		emptyStateEntityType: "attributes",
		defaultFormData: {
			name: "",
			slug: "",
			isActive: true,
		},
		formFields: AttributeFormFields,
		renderList: AttributeList,
	};

	return (
		<DashboardEntityManager
			config={entityManagerConfig}
			data={attributes || []}
		/>
	);
}
