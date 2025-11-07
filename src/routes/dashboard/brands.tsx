import {
	useQuery,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Edit, Loader2 } from "lucide-react";
import { useMemo } from "react";
import { CountriesManager } from "~/components/ui/dashboard/CountriesManager";
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
import { Image } from "~/components/ui/shared/Image";
import { ASSETS_BASE_URL } from "~/constants/urls";
import {
	brandsQueryOptions,
	countriesQueryOptions,
	productBrandCountsQueryOptions,
} from "~/lib/queryOptions";
import { createBrand } from "~/server_functions/dashboard/brands/createBrand";
import { deleteBrand } from "~/server_functions/dashboard/brands/deleteBrand";
import { updateBrand } from "~/server_functions/dashboard/brands/updateBrand";
import { getAllBrands } from "~/server_functions/dashboard/getAllBrands";
import type { Brand, BrandFormData } from "~/types";

// Brand form fields component
const BrandFormFields = ({
	formData,
	onFieldChange,
	idPrefix,
}: EntityFormFieldsProps<Brand, BrandFormData>) => {
	// Fetch countries from database (already prefetched in loader)
	const { data: countries = [] } = useSuspenseQuery(countriesQueryOptions());

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
					className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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

// Type for brand with potentially loading count
type BrandWithCount = Brand & {
	productCount: number | null; // null means count is still loading
	countryFlagImage?: string | null; // Country flag image from join
};

// Brand list component using the meta component
const BrandList = ({ entities, onEdit }: EntityListProps<BrandWithCount>) => (
	<EntityCardGrid
		entities={entities}
		onEdit={onEdit}
		gridClassName="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3"
		renderEntity={(brand) => (
			<div className="flex flex-col w-auto items-start">
				{/* Brand Image with Edit Label Overlay */}
				<div className="relative w-full mb-2 aspect-square overflow-hidden group">
					{brand.image ? (
						<div className="relative w-full h-full flex items-center justify-center">
							<Image
								src={`${ASSETS_BASE_URL}/${brand.image}`}
								alt={brand.name}
								className="object-contain w-full h-full"
							/>
							{/* Desktop Edit Indicator - Centered on image (identical to ProductCard) */}
							<div className="absolute inset-0 hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-[var(--transition-standard)] pointer-events-none z-10">
								<div className="flex items-center justify-center gap-2 px-4 py-2 bg-background/70 backdrop-blur-sm rounded-md border border-border/50">
									<Edit className="w-4 h-4" />
									<span className="text-sm font-medium">Изменить</span>
								</div>
							</div>
						</div>
					) : (
						<div className="w-full h-full bg-muted flex items-center justify-center">
							<span className="text-xs text-muted-foreground">?</span>
						</div>
					)}
				</div>

				{/* Brand Name and Count */}
				<div className="flex items-center gap-2 mb-1">
					<span className="text-sm font-medium whitespace-nowrap">
						{brand.name}
					</span>
					{brand.productCount === null ? (
						<span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded flex items-center gap-1">
							<Loader2 className="w-3 h-3 animate-spin" />
						</span>
					) : brand.productCount > 0 ? (
						<span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
							{brand.productCount}
						</span>
					) : null}
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
		)}
	/>
);

export const Route = createFileRoute("/dashboard/brands")({
	component: RouteComponent,
	pendingComponent: BrandsPageSkeleton,

	// Loader prefetches brands and countries (fast) before component renders
	// Counts will load separately and stream in
	loader: async ({ context: { queryClient } }) => {
		// Only prefetch brands and countries (fast), not counts (slower)
		await Promise.all([
			queryClient.ensureQueryData(brandsQueryOptions()),
			queryClient.ensureQueryData(countriesQueryOptions()),
		]);
	},
});

function RouteComponent() {
	const queryClient = useQueryClient();

	// Load brands with Suspense (fast - guaranteed to be loaded by loader)
	const { data: brands } = useSuspenseQuery(brandsQueryOptions());

	// Load counts separately with regular query (slower - streams in)
	const { data: counts } = useQuery(productBrandCountsQueryOptions());

	// Merge brands with counts
	const brandsWithCounts = useMemo((): BrandWithCount[] => {
		return brands.map((brand) => ({
			...brand,
			productCount: counts?.[brand.slug] ?? null, // null = still loading
		}));
	}, [brands, counts]);

	// Entity manager configuration
	const entityManagerConfig = {
		queryKey: ["bfloorBrands"],
		queryFn: getAllBrands,
		createFn: async (data: { data: BrandFormData }) => {
			await createBrand({
				data: {
					name: data.data.name,
					slug: data.data.slug,
					logo: data.data.logo || "",
					countryId: data.data.countryId || null,
					isActive: data.data.isActive,
				},
			});
			// DashboardEntityManager will invalidate ["bfloorBrands"]
			// Also invalidate counts so they refresh
			queryClient.invalidateQueries({
				queryKey: ["productBrandCounts"],
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
						countryId: data.data.countryId || null,
						isActive: data.data.isActive,
					},
				},
			});
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
				{/* Countries Management Section */}
				<CountriesManager className="mb-6" />

				{/* Brands Management Section */}
				<div>
					<h2 className="text-lg font-semibold mb-4">Бренды</h2>
					<DashboardEntityManager
						config={entityManagerConfig}
						data={brandsWithCounts}
					/>
				</div>
			</div>
		</div>
	);
}
