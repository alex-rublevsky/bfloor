import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	DashboardEntityManager,
	type EntityFormData,
	type EntityFormFieldsProps,
	type EntityListProps,
	type EntityManagerConfig,
} from "~/components/ui/dashboard/DashboardEntityManager";
import { EntityCardContent } from "~/components/ui/dashboard/EntityCardContent";
import { EntityCardGrid } from "~/components/ui/dashboard/EntityCardGrid";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/shared/Select";
import {
	brandsQueryOptions,
	collectionsQueryOptions,
} from "~/lib/queryOptions";
import { createCollection } from "~/server_functions/dashboard/collections/createCollection";
import { deleteCollection } from "~/server_functions/dashboard/collections/deleteCollection";
import { getAllCollections } from "~/server_functions/dashboard/collections/getAllCollections";
import { updateCollection } from "~/server_functions/dashboard/collections/updateCollection";
import type { Collection, CollectionFormData } from "~/types";

// Collection form fields component
const CollectionFormFields = ({
	formData,
	onFieldChange,
	idPrefix,
}: EntityFormFieldsProps<Collection, CollectionFormData & EntityFormData>) => {
	// Get brands for the select dropdown (data is already loaded by loader)
	const { data: brands = [] } = useQuery(brandsQueryOptions());

	return (
		<>
			{/* Brand selection */}
			<div>
				<label
					htmlFor={`${idPrefix}-collection-brand`}
					className="block text-sm font-medium mb-1"
				>
					Бренд <span className="text-red-500">*</span>
				</label>
				<Select
					value={(formData as CollectionFormData).brandSlug || ""}
					onValueChange={(value: string) => {
						onFieldChange("brandSlug", value);
					}}
					required
				>
					<SelectTrigger id={`${idPrefix}-collection-brand`}>
						<SelectValue placeholder="Выберите бренд" />
					</SelectTrigger>
					<SelectContent>
						{brands.map((brand) => (
							<SelectItem key={brand.slug} value={brand.slug}>
								{brand.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		</>
	);
};

// Collection list component using the reusable component
const CollectionList = ({ entities, onEdit }: EntityListProps<Collection>) => {
	const { data: brands } = useSuspenseQuery(brandsQueryOptions());

	return (
		<EntityCardGrid
			entities={entities}
			onEdit={onEdit}
			renderEntity={(collection) => {
				const brand = brands.find((b) => b.slug === collection.brandSlug);
				return (
					<EntityCardContent
						name={collection.name}
						slug={collection.slug}
						isActive={collection.isActive}
						secondaryInfo={brand ? `Бренд: ${brand.name}` : undefined}
					/>
				);
			}}
		/>
	);
};

export const Route = createFileRoute("/dashboard/collections")({
	component: RouteComponent,

	loader: async ({ context: { queryClient } }) => {
		await Promise.all([
			queryClient.ensureQueryData(collectionsQueryOptions()),
			queryClient.ensureQueryData(brandsQueryOptions()),
		]);
	},
});

function RouteComponent() {
	// Use suspense query - data is guaranteed to be loaded by the loader
	const { data } = useSuspenseQuery(collectionsQueryOptions());

	// Entity manager configuration
	const entityManagerConfig = {
		queryKey: ["bfloorCollections"],
		queryFn: getAllCollections,
		createFn: async (data: { data: CollectionFormData }) => {
			await createCollection({
				data: {
					data: {
						name: data.data.name,
						slug: data.data.slug,
						brandSlug: data.data.brandSlug,
						isActive: data.data.isActive,
					},
				},
			});
		},
		updateFn: async (data: { id: number; data: CollectionFormData }) => {
			await updateCollection({
				data: {
					id: data.id,
					data: {
						name: data.data.name,
						slug: data.data.slug,
						brandSlug: data.data.brandSlug,
						isActive: data.data.isActive,
					},
				},
			});
		},
		deleteFn: async (data: { id: number }) => {
			await deleteCollection({
				data: { data: { id: data.id } },
			});
		},
		entityName: "коллекция",
		entityNamePlural: "коллекции",
		emptyStateEntityType: "collections",
		defaultFormData: {
			name: "",
			slug: "",
			brandSlug: "",
			isActive: true,
		} as CollectionFormData,
		formFields: CollectionFormFields,
		renderList: CollectionList,
	} as unknown as EntityManagerConfig<Collection, CollectionFormData>;

	return (
		<div className="px-6 py-6">
			<DashboardEntityManager config={entityManagerConfig} data={data || []} />
		</div>
	);
}
