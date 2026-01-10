import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { useMemo } from "react";
import {
	DashboardEntityManager,
	type EntityFormFieldsProps,
	type EntityListProps,
	type EntityManagerConfig,
} from "~/components/ui/dashboard/DashboardEntityManager";
import { EntityCardGrid } from "~/components/ui/dashboard/EntityCardGrid";
import { ImageUpload } from "~/components/ui/dashboard/ImageUpload";
import { BrandsPageSkeleton } from "~/components/ui/dashboard/skeletons/BrandsPageSkeleton";
import { Badge } from "~/components/ui/shared/Badge";
import { Edit } from "~/components/ui/shared/Icon";
import { Image } from "~/components/ui/shared/Image";
import styles from "~/components/ui/store/productCard.module.css";
import { ASSETS_BASE_URL } from "~/constants/urls";
import { getActiveCountries } from "~/data/countries";
import {
	brandsQueryOptions,
	productBrandCountsQueryOptions,
} from "~/lib/queryOptions";
import { createBrand } from "~/server_functions/dashboard/brands/createBrand";
import { deleteBrand } from "~/server_functions/dashboard/brands/deleteBrand";
import { updateBrand } from "~/server_functions/dashboard/brands/updateBrand";
import { getAllBrands } from "~/server_functions/dashboard/getAllBrands";
import { deleteProductImage } from "~/server_functions/dashboard/store/deleteProductImage";
import type { Brand, BrandFormData } from "~/types";
import { simpleSearchSchema } from "~/utils/searchSchemas";

// Brand form fields component
const BrandFormFields = ({
	formData,
	onFieldChange,
	idPrefix,
}: EntityFormFieldsProps<Brand, BrandFormData>) => {
	// Get countries from hardcoded data
	const countries = getActiveCountries();

	return (
		<>
			{/* Logo Upload */}
			<ImageUpload
				currentImages={(formData as BrandFormData).logo || ""}
				onImagesChange={(images) => onFieldChange("logo", images)}
				folder="brands"
				slug={(formData as BrandFormData).slug}
				productName={(formData as BrandFormData).name}
				label="Логотип бренда"
			/>

			{/* Country selection */}
			<div>
				<label
					htmlFor={`${idPrefix}-brand-country`}
					className="block text-sm font-medium mb-1"
				>
					Страна
				</label>
				<select
					id={`${idPrefix}-brand-country`}
					value={(formData as BrandFormData).countryId?.toString() || ""}
					onChange={(e) =>
						onFieldChange(
							"countryId",
							e.target.value ? parseInt(e.target.value, 10) : null,
						)
					}
					className="flex h-9 field-sizing-content rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
				>
					<option value="">Не указано</option>
					{countries.map((country) => (
						<option key={country.id} value={country.id.toString()}>
							{country.name} ({country.code})
						</option>
					))}
				</select>
			</div>
		</>
	);
};

// Type for brand with count
type BrandWithCount = Brand & {
	productCount: number; // Count is always available (loaded with Suspense)
	countryFlagImage?: string | null; // Country flag image from join
};

// Brand list component using the meta component
const BrandList = ({ entities, onEdit }: EntityListProps<BrandWithCount>) => (
	<EntityCardGrid
		entities={entities}
		onEdit={onEdit}
		mode="vertical"
		gridClassName="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 md:gap-3"
		renderEntity={(brand) => (
			<div
				className="w-full product-card overflow-hidden group"
				id={styles.productCard}
			>
				<div className="bg-background flex flex-col">
					{/* Image Section */}
					<div className="relative aspect-square overflow-hidden">
						{brand.image ? (
							<div className="relative w-full h-full flex items-center justify-center">
								<Image
									src={`${ASSETS_BASE_URL}/${brand.image}`}
									alt={brand.name}
									className="w-full h-full object-contain"
								/>
							</div>
						) : (
							<div className="absolute inset-0 bg-muted flex items-center justify-center">
								<span className="text-xs text-muted-foreground">?</span>
							</div>
						)}

					{/* Desktop Edit Indicator - Centered on image (identical to ProductCard) */}
					<div className="absolute inset-0 hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
						<div className="flex items-center justify-center gap-2 px-3 py-1.5 bg-background/80 backdrop-blur-[2px] rounded-md border border-border/30 text-primary">
							<Edit className="w-4 h-4" />
							<span className="text-sm font-medium">Изменить</span>
						</div>
					</div>
					</div>

					{/* Content Section */}
					<div className="flex flex-col h-auto md:h-full">
						<div className="p-4 flex flex-col h-auto md:h-full">
							{/* Brand Name and Count */}
							<div className="flex items-center gap-2 mb-1">
								<span className="text-sm font-medium whitespace-nowrap">
									{brand.name}
								</span>
								{brand.productCount > 0 && (
									<span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
										{brand.productCount}
									</span>
								)}
								{!brand.isActive && (
									<Badge variant="secondary" className="text-xs flex-shrink-0">
										Inactive
									</Badge>
								)}
							</div>

							{/* Slug and Country Flag */}
							<div className="flex items-center gap-2">
								<span className="text-xs text-muted-foreground whitespace-nowrap">
									{brand.slug}
								</span>
								{/* Country Flag */}
								{brand.countryFlagImage && (
									<div className="h-4 w-4 relative flex-shrink-0">
										<Image
											src={brand.countryFlagImage}
											alt="Country flag"
											className="object-contain"
											width={16}
										/>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		)}
	/>
);

export const Route = createFileRoute("/dashboard/brands")({
	component: RouteComponent,
	pendingComponent: BrandsPageSkeleton,
	validateSearch: zodValidator(simpleSearchSchema),

	// Loader prefetches brands and counts before component renders
	// This ensures consistent server/client rendering and prevents hydration mismatches
	// Countries are now hardcoded and don't need prefetching
	loader: async ({ context: { queryClient } }) => {
		// Prefetch all data to ensure consistent server/client rendering
		await Promise.all([
			queryClient.ensureQueryData(brandsQueryOptions()),
			queryClient.ensureQueryData(productBrandCountsQueryOptions()),
		]);
	},
});

function RouteComponent() {
	const queryClient = useQueryClient();

	// Get search params from URL (Zod ensures search is string | undefined)
	const searchParams = Route.useSearch();
	const searchTerm = searchParams.search ?? "";

	// Load brands with Suspense (fast - guaranteed to be loaded by loader)
	const { data: brands } = useSuspenseQuery(brandsQueryOptions());

	// Load counts with Suspense (also prefetched in loader - ensures consistent server/client rendering)
	const { data: counts } = useSuspenseQuery(productBrandCountsQueryOptions());

	// Merge brands with counts
	const brandsWithCounts = useMemo((): BrandWithCount[] => {
		return brands.map((brand) => ({
			...brand,
			productCount: counts?.[brand.slug] ?? 0, // Use 0 as default instead of null for consistent rendering
		}));
	}, [brands, counts]);

	// Entity manager configuration
	const entityManagerConfig = {
		queryKey: ["bfloorBrands"],
		queryFn: getAllBrands,
		createFn: async (data: { data: BrandFormData }) => {
			await createBrand({ data: data.data });
			// DashboardEntityManager will invalidate ["bfloorBrands"]
			// Also invalidate counts so they refresh
			queryClient.invalidateQueries({
				queryKey: ["productBrandCounts"],
			});
		},
		updateFn: async (data: { id: number; data: BrandFormData }) => {
			// Get the current brand to check for old logo
			const currentBrand = brands.find((b) => b.id === data.id);
			const oldLogo = currentBrand?.image || "";

			// Delete old logo from R2 if it changed and exists
			if (
				oldLogo &&
				oldLogo !== data.data.logo &&
				!oldLogo.startsWith("staging/")
			) {
				try {
					console.log("🗑️ Deleting old brand logo:", oldLogo);
					await deleteProductImage({ data: { filename: oldLogo } });
					console.log("✅ Old brand logo deleted successfully");
				} catch (deleteError) {
					console.warn("⚠️ Failed to delete old brand logo:", deleteError);
					// Don't fail the update if deletion fails
				}
			}

			await updateBrand({ data });
			// DashboardEntityManager will invalidate ["bfloorBrands"]
			// Also invalidate counts so they refresh
			queryClient.invalidateQueries({
				queryKey: ["productBrandCounts"],
			});
		},
		deleteFn: async (data: { id: number }) => {
			await deleteBrand({ data });
			// DashboardEntityManager will invalidate ["bfloorBrands"]
			// Also invalidate counts so they refresh
			queryClient.invalidateQueries({
				queryKey: ["productBrandCounts"],
			});
		},
		entityName: "бренд",
		entityNamePlural: "бренды",
		emptyStateEntityType: "brands",
		defaultFormData: {
			name: "",
			slug: "",
			logo: "",
			countryId: null,
			isActive: true,
		} as BrandFormData,
		formFields: BrandFormFields,
		renderList: BrandList,
	} as unknown as EntityManagerConfig<BrandWithCount, BrandFormData>;

	return (
		<div className="h-full overflow-auto">
			<div className="space-y-6 px-6 py-6">
				{/* Brands Management Section */}
				<div>
					<h2 className="text-lg font-semibold mb-4">Бренды</h2>
					<DashboardEntityManager
						config={entityManagerConfig}
						data={brandsWithCounts}
						searchTerm={searchTerm}
					/>
				</div>
			</div>
		</div>
	);
}
