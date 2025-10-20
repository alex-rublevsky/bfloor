import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	DashboardEntityManager,
	type EntityFormFieldsProps,
	type EntityListProps,
} from "~/components/ui/dashboard/DashboardEntityManager";
import { EntityCardGrid } from "~/components/ui/dashboard/EntityCardGrid";
import { ImageUpload } from "~/components/ui/dashboard/ImageUpload";
import { BrandsPageSkeleton } from "~/components/ui/dashboard/skeletons/BrandsPageSkeleton";
import { Badge } from "~/components/ui/shared/Badge";
import { Image } from "~/components/ui/shared/Image";
import { ASSETS_BASE_URL } from "~/constants/urls";
import { createBrand } from "~/server_functions/dashboard/brands/createBrand";
import { deleteBrand } from "~/server_functions/dashboard/brands/deleteBrand";
import { updateBrand } from "~/server_functions/dashboard/brands/updateBrand";
import { getAllBrands } from "~/server_functions/dashboard/getAllBrands";
import type { Brand, BrandFormData } from "~/types";

// Brand form fields component
const BrandFormFields = ({
	formData,
	onFieldChange,
}: EntityFormFieldsProps<Brand, BrandFormData>) => {
	return (
		<>
			{/* Logo Upload */}
			<ImageUpload
				currentImages={(formData as BrandFormData).logo || ""}
				onImagesChange={(images) => onFieldChange("logo", images)}
				folder="brands"
				slug={(formData as BrandFormData).slug}
				productName={(formData as BrandFormData).name}
			/>
		</>
	);
};

// Brand list component using the meta component
const BrandList = ({ entities, onEdit, onDelete }: EntityListProps<Brand>) => (
	<EntityCardGrid
		entities={entities}
		onEdit={onEdit}
		onDelete={onDelete}
		renderEntity={(brand) => (
			<>
				{/* Brand Logo */}
				<div className="flex-shrink-0">
					{brand.image ? (
						<div className="h-8 w-8 relative">
							<Image
								src={`${ASSETS_BASE_URL}/${brand.image}`}
								alt={brand.name}
								className="object-cover rounded"
							/>
						</div>
					) : (
						<div className="h-8 w-8 bg-muted rounded flex items-center justify-center">
							<span className="text-xs text-muted-foreground">?</span>
						</div>
					)}
				</div>

				{/* Brand Info */}
				<div className="flex flex-col flex-1 min-w-0">
					<div className="flex items-center gap-2">
						<span className="text-sm font-medium truncate">{brand.name}</span>
						{!brand.isActive && (
							<Badge variant="secondary" className="text-xs flex-shrink-0">
								Inactive
							</Badge>
						)}
					</div>
					<span className="text-xs text-muted-foreground truncate">
						{brand.slug}
					</span>
				</div>
			</>
		)}
	/>
);

// Query options factory for reuse
const brandsQueryOptions = () => ({
	queryKey: ["bfloorDashboardBrands"],
	queryFn: () => getAllBrands(),
	staleTime: 1000 * 60 * 5, // Cache for 5 minutes
});

export const Route = createFileRoute("/dashboard/brands")({
	component: RouteComponent,
	pendingComponent: BrandsPageSkeleton,

	// Loader prefetches data before component renders
	loader: async ({ context: { queryClient } }) => {
		// Ensure data is loaded before component renders
		await queryClient.ensureQueryData(brandsQueryOptions());
	},
});

function RouteComponent() {
	// Use suspense query - data is guaranteed to be loaded by the loader
	const { data } = useSuspenseQuery(brandsQueryOptions());

	// Entity manager configuration
	const entityManagerConfig = {
		queryKey: ["bfloorDashboardBrands"],
		queryFn: getAllBrands,
		createFn: async (data: { data: BrandFormData }) => {
			await createBrand({
				data: {
					name: data.data.name,
					slug: data.data.slug,
					logo: data.data.logo || "",
					isActive: data.data.isActive,
				},
			});
		},
		updateFn: async (data: { id: number; data: BrandFormData }) => {
			await updateBrand({
				data: {
					id: data.id,
					data: {
						name: data.data.name,
						slug: data.data.slug,
						logo: data.data.logo || "",
						isActive: data.data.isActive,
					},
				},
			});
		},
		deleteFn: async (data: { id: number }) => {
			await deleteBrand({ data });
		},
		entityName: "бренд",
		entityNamePlural: "бренды",
		emptyStateEntityType: "brands",
		defaultFormData: {
			name: "",
			slug: "",
			logo: "",
			isActive: true,
		} as BrandFormData,
		formFields: BrandFormFields,
		renderList: BrandList,
	};

	return (
		<DashboardEntityManager config={entityManagerConfig} data={data || []} />
	);
}
