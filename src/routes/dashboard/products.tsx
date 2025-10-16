import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useCallback, useEffect, useId, useState } from "react";
import { toast } from "sonner";
import { AdminProductCard } from "~/components/ui/dashboard/AdminProductCard";
import DeleteConfirmationDialog from "~/components/ui/dashboard/ConfirmationDialog";
import { DashboardFormDrawer } from "~/components/ui/dashboard/DashboardFormDrawer";
import { DescriptionField } from "~/components/ui/dashboard/DescriptionField";
import { ImageUpload } from "~/components/ui/dashboard/ImageUpload";
import { DrawerSection } from "~/components/ui/dashboard/ProductFormSection";
import { ProductSettingsFields } from "~/components/ui/dashboard/ProductSettingsFields";
import ProductVariationForm from "~/components/ui/dashboard/ProductVariationForm";
import { SlugField } from "~/components/ui/dashboard/SlugField";
import { ProductsPageSkeleton } from "~/components/ui/dashboard/skeletons/ProductsPageSkeleton";
import { ProductStatsCompact } from "~/components/ui/shared/productNumberAndWeightDisplay";
import { Input } from "~/components/ui/shared/Input";
import { SearchInput } from "~/components/ui/shared/SearchInput";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/shared/Select";
import {
	getCountryFlag,
	getCountryName,
	SHIPPING_COUNTRIES,
} from "~/constants/countries";
import { generateSlug, useSlugGeneration } from "~/hooks/useSlugGeneration";
import { storeDataQueryOptions } from "~/lib/queryOptions";
import { cn } from "~/lib/utils";
import { createProduct } from "~/server_functions/dashboard/store/createProduct";
import { deleteProduct } from "~/server_functions/dashboard/store/deleteProduct";
import { deleteProductImage } from "~/server_functions/dashboard/store/deleteProductImage";
import { getAllProducts } from "~/server_functions/dashboard/store/getAllProducts";
import { getProductBySlug } from "~/server_functions/dashboard/store/getProductBySlug";
import { updateProduct } from "~/server_functions/dashboard/store/updateProduct";
import type {
	Brand,
	Category,
	ProductFormData,
	ProductGroup,
	ProductVariationWithAttributes,
	ProductWithVariations,
	VariationAttribute,
} from "~/types";

interface Variation {
	id: string;
	sku: string;
	price: number;
	stock: number;
	discount?: number | null;
	sort: number;
	shippingFrom?: string;
	attributes: VariationAttribute[];
}

// Query options factory for reuse
const productsQueryOptions = () => ({
	queryKey: ["bfloorDashboardProducts"],
	queryFn: () => getAllProducts(),
	staleTime: 1000 * 60 * 5, // Cache for 5 minutes
});

export const Route = createFileRoute("/dashboard/products")({
	component: RouteComponent,
	pendingComponent: ProductsPageSkeleton,

	// Loader prefetches data before component renders
	loader: async ({ context: { queryClient } }) => {
		// Ensure data is loaded before component renders
		await queryClient.ensureQueryData(productsQueryOptions());
	},
});

function RouteComponent() {
	const queryClient = useQueryClient();

	// Use suspense query - data is guaranteed to be loaded by the loader
	const { data: productsData } = useSuspenseQuery(productsQueryOptions());

	// Function to refetch data using query invalidation
	const refetch = () => {
		// Invalidate dashboard products cache
		queryClient.invalidateQueries({
			queryKey: ["bfloorDashboardProducts"],
		});

		// Remove store data cache completely - forces fresh fetch on all clients
		queryClient.removeQueries({
			queryKey: storeDataQueryOptions().queryKey,
		});
	};

	// Function to invalidate specific product cache (for updates)
	const invalidateProductCache = (
		_productId: number,
		oldSlug?: string,
		newSlug?: string,
	) => {
		// Remove store data cache completely - forces fresh fetch on all clients
		queryClient.removeQueries({
			queryKey: storeDataQueryOptions().queryKey,
		});

		// If slug changed, remove both old and new product pages
		if (oldSlug && newSlug && oldSlug !== newSlug) {
			queryClient.removeQueries({
				queryKey: ["bfloorProduct", oldSlug],
			});
			queryClient.removeQueries({
				queryKey: ["bfloorProduct", newSlug],
			});
		} else if (newSlug) {
			// If only new slug available, remove that product page
			queryClient.removeQueries({
				queryKey: ["bfloorProduct", newSlug],
			});
		}
		// If no slug info, don't remove individual product pages
		// (they'll get fresh data from storeData when accessed)
	};

	// Generate unique IDs for form elements
	const editStockId = useId();
	const editCategoryId = useId();
	const editBrandId = useId();

	const editWeightId = useId();
	const editShipsFromId = useId();
	const addShipsFromId = useId();

	const addPriceId = useId();
	const addCategoryId = useId();
	const addBrandId = useId();
	const editProductFormId = useId();
	const createProductFormId = useId();
	const editPriceId = useId();

	const defaultFormData = {
		name: "",
		slug: "",
		description: "",
		price: "0",
		categorySlug: "",
		brandSlug: "",
		stock: "0",
		isActive: true,
		isFeatured: false,
		discount: null,
		hasVariations: false,
		weight: "",
		images: "",
		shippingFrom: "",
		variations: [],
	};

	// All state hooks at the top level
	const [formData, setFormData] = useState<ProductFormData>(defaultFormData);
	const [editFormData, setEditFormData] =
		useState<ProductFormData>(defaultFormData);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState("");
	const [isAutoSlug, setIsAutoSlug] = useState(true);
	const [isEditAutoSlug, setIsEditAutoSlug] = useState(false);
	const [isEditMode, setIsEditMode] = useState(false);
	const [editingProductId, setEditingProductId] = useState<number | null>(null);
	const [originalProductSlug, setOriginalProductSlug] = useState<string>("");
	const [showEditModal, setShowEditModal] = useState(false);
	const [variations, setVariations] = useState<Variation[]>([]);
	const [editVariations, setEditVariations] = useState<Variation[]>([]);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [deletingProductId, setDeletingProductId] = useState<number | null>(
		null,
	);
	const [isDeleting, setIsDeleting] = useState(false);
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
	const [_deletedImages, setDeletedImages] = useState<string[]>([]);
	const [editDeletedImages, setEditDeletedImages] = useState<string[]>([]);

	// Search state
	const [searchTerm, setSearchTerm] = useState("");

	// Stable callbacks for slug generation
	const handleCreateSlugChange = useCallback(
		(slug: string) => setFormData((prev) => ({ ...prev, slug })),
		[],
	);

	const handleEditSlugChange = useCallback(
		(slug: string) => setEditFormData((prev) => ({ ...prev, slug })),
		[],
	);

	// Auto-slug generation hooks
	useSlugGeneration(formData.name, isAutoSlug, handleCreateSlugChange);
	useSlugGeneration(editFormData.name, isEditAutoSlug, handleEditSlugChange);

	useEffect(() => {
		setFormData((prev) => ({
			...prev,
			variations: variations.map((v) => ({
				id: v.id.startsWith("temp-") ? undefined : parseInt(v.id, 10),
				sku: v.sku,
				price: v.price.toString(),
				stock: v.stock.toString(),
				sort: v.sort,
				shippingFrom: v.shippingFrom,
				attributes: v.attributes.map((attr) => ({
					attributeId: attr.attributeId,
					value: attr.value,
				})),
			})),
		}));
	}, [variations]);

	useEffect(() => {
		setEditFormData((prev) => ({
			...prev,
			variations: editVariations.map((v) => ({
				id: v.id.startsWith("temp-") ? undefined : parseInt(v.id, 10),
				sku: v.sku,
				price: v.price.toString(),
				stock: v.stock.toString(),
				sort: v.sort,
				shippingFrom: v.shippingFrom,
				attributes: v.attributes.map((attr) => ({
					attributeId: attr.attributeId,
					value: attr.value,
				})),
			})),
		}));
	}, [editVariations]);

	// Listen for action button clicks from navbar
	useEffect(() => {
		const handleAction = () => {
			setShowCreateForm(true);
		};

		window.addEventListener("dashboardAction", handleAction);
		return () => window.removeEventListener("dashboardAction", handleAction);
	}, []);

	// Event handlers and utility functions
	const handleVariationsChange = (newVariations: Variation[]) => {
		setVariations(newVariations);
	};

	const handleEditVariationsChange = (newVariations: Variation[]) => {
		setEditVariations(newVariations);
	};

	const handleImagesChange = (images: string, deletedImagesList?: string[]) => {
		setFormData((prev) => ({ ...prev, images }));
		if (deletedImagesList) {
			setDeletedImages(deletedImagesList);
		}
	};

	const handleEditImagesChange = (
		images: string,
		deletedImagesList?: string[],
	) => {
		setEditFormData((prev) => ({ ...prev, images }));
		if (deletedImagesList) {
			setEditDeletedImages(deletedImagesList);
		}
	};

	const closeCreateModal = () => {
		setShowCreateForm(false);
		setFormData(defaultFormData);
		setVariations([]);
		setDeletedImages([]);
		setIsAutoSlug(true);
		setHasAttemptedSubmit(false);
		setError("");
	};

	const closeEditModal = () => {
		setShowEditModal(false);
		setEditingProductId(null);
		setOriginalProductSlug(""); // Reset original slug
		setEditFormData(defaultFormData);
		setEditVariations([]);
		setEditDeletedImages([]);
		setIsEditAutoSlug(false);
		setError("");
	};

	const formatPrice = (price: number | string | null): string => {
		if (price === null) return "$0.00";
		const numericPrice = typeof price === "string" ? parseFloat(price) : price;
		return new Intl.NumberFormat("en-CA", {
			style: "currency",
			currency: "р",
		}).format(numericPrice);
	};

	const { groupedProducts, categories, brands } = productsData;

	// Filter grouped products based on search
	// Products are already sorted by availability on the server side
	const displayGroupedProducts: ProductGroup[] = searchTerm
		? groupedProducts
				.map((group) => ({
					...group,
					products: group.products.filter(
						(product) =>
							product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
							product.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
							group.title.toLowerCase().includes(searchTerm.toLowerCase()),
					),
				}))
				.filter((group) => group.products.length > 0)
		: groupedProducts;

	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>,
	) => {
		const { name, value, type } = e.target;
		const checked = (e.target as HTMLInputElement).checked;

		let updatedFormData: ProductFormData = { ...formData };

		// Handle slug auto-generation
		if (name === "slug") {
			setIsAutoSlug(false);
		}

		// Handle regular form fields
		if (name === "discount") {
			// Handle discount field specifically - allow empty string to be converted to null
			updatedFormData = {
				...updatedFormData,
				discount: value === "" ? null : parseInt(value, 10) || null,
			};
		} else {
			updatedFormData = {
				...updatedFormData,
				[name]: type === "checkbox" ? checked : value,
			};
		}

		// Handle variations creation
		if (name === "hasVariations" && checked && variations.length === 0) {
			const defaultVariation: Variation = {
				id: `temp-${Date.now()}`,
				sku: "",
				price: updatedFormData.price ? parseFloat(updatedFormData.price) : 0,
				stock: updatedFormData.stock ? parseInt(updatedFormData.stock, 10) : 0,
				sort: 0,
				shippingFrom: undefined,
				attributes: [],
			};
			setVariations([defaultVariation]);
		}

		setFormData(updatedFormData);
	};

	const handleEditChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>,
	) => {
		const { name, value, type } = e.target;
		const checked = (e.target as HTMLInputElement).checked;

		let updatedFormData: ProductFormData = { ...editFormData };

		// Handle slug auto-generation
		if (name === "slug") {
			setIsEditAutoSlug(false);
		}

		// Handle regular form fields
		if (name === "discount") {
			// Handle discount field specifically - allow empty string to be converted to null
			updatedFormData = {
				...updatedFormData,
				discount: value === "" ? null : parseInt(value, 10) || null,
			};
		} else {
			updatedFormData = {
				...updatedFormData,
				[name]: type === "checkbox" ? checked : value,
			};
		}

		// Handle variations creation
		if (name === "hasVariations" && checked && editVariations.length === 0) {
			const defaultVariation: Variation = {
				id: `temp-${Date.now()}`,
				sku: "",
				price: updatedFormData.price ? parseFloat(updatedFormData.price) : 0,
				stock: updatedFormData.stock ? parseInt(updatedFormData.stock, 10) : 0,
				sort: 0,
				shippingFrom: undefined,
				attributes: [],
			};
			setEditVariations([defaultVariation]);
		}

		setEditFormData(updatedFormData);
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setHasAttemptedSubmit(true);

		// Collect validation errors
		const errors: string[] = [];
		if (!formData.name) errors.push("Product Name");
		if (!formData.slug) errors.push("Slug");
		if (!formData.price) errors.push("Price");
		if (!formData.categorySlug) errors.push("Category");

		if (errors.length > 0) {
			toast.error(`Please fill in all required fields: ${errors.join(", ")}`);
			return;
		}

		setIsSubmitting(true);
		setError("");

		try {
			const formattedVariations = variations.map((variation: Variation) => ({
				id: variation.id.startsWith("temp-")
					? undefined
					: parseInt(variation.id, 10),
				sku: variation.sku,
				price: variation.price.toString(),
				stock: variation.stock.toString(),
				sort: variation.sort,
				shippingFrom: variation.shippingFrom,
				attributes: variation.attributes.map((attr: VariationAttribute) => ({
					attributeId: attr.attributeId,
					value: attr.value,
				})),
			}));

			const submissionData = {
				...formData,
				variations: formattedVariations,
			};

			await createProduct({ data: submissionData });

			toast.success("Product added successfully!");

			// Reset form state and close modal
			closeCreateModal();

			// Refresh data
			refetch();
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "An error occurred";
			setError(errorMessage);
			toast.error(errorMessage);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!editingProductId) {
			return;
		}

		setIsSubmitting(true);
		setError("");

		try {
			// Delete images from R2 first
			if (editDeletedImages.length > 0) {
				const deletePromises = editDeletedImages.map((filename) =>
					deleteProductImage({ data: { filename } }).catch((error) => {
						console.error(`Failed to delete ${filename}:`, error);
						// Don't fail the whole update if one image deletion fails
					}),
				);
				await Promise.all(deletePromises);
				toast.success(
					`Deleted ${editDeletedImages.length} image(s) from storage`,
				);
			}

			const formattedVariations = editVariations.map(
				(variation: Variation) => ({
					id: variation.id.startsWith("temp-")
						? undefined
						: parseInt(variation.id, 10),
					sku: variation.sku,
					price: variation.price.toString(),
					stock: variation.stock.toString(),
					sort: variation.sort,
					shippingFrom: variation.shippingFrom,
					attributes: variation.attributes.map((attr: VariationAttribute) => ({
						attributeId: attr.attributeId,
						value: attr.value,
					})),
				}),
			);

			const submissionData = {
				...editFormData,
				variations: formattedVariations,
			};

			await updateProduct({
				data: { id: editingProductId, data: submissionData },
			});

			toast.success("Product updated successfully!");

			// Reset form state
			closeEditModal();

			// Refresh dashboard data
			refetch();

			// Invalidate specific product cache
			invalidateProductCache(
				editingProductId,
				originalProductSlug,
				editFormData.slug,
			);
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "An error occurred";
			setError(errorMessage);
			toast.error(errorMessage);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteClick = (product: ProductWithVariations) => {
		setDeletingProductId(product.id);
		setShowDeleteDialog(true);
	};

	const handleDeleteConfirm = async () => {
		if (!deletingProductId) return;

		setIsDeleting(true);
		setError("");

		try {
			await deleteProduct({ data: { id: deletingProductId } });

			toast.success("Product deleted successfully!");
			setShowDeleteDialog(false);
			setDeletingProductId(null);

			// Refresh data
			refetch();
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
			toast.error(err instanceof Error ? err.message : "An error occurred");
		} finally {
			setIsDeleting(false);
		}
	};

	const handleDeleteCancel = () => {
		setShowDeleteDialog(false);
		setDeletingProductId(null);
	};

	const handleEdit = async (product: ProductWithVariations) => {
		setEditingProductId(product.id);
		setOriginalProductSlug(product.slug); // Store original slug
		setShowEditModal(true);
		setIsEditMode(true);

		try {
			// Fetch complete product data including variations and categories
			const productWithDetails = await getProductBySlug({
				data: { id: product.id },
			});

			// Convert variations to the frontend format
			const formattedVariations =
				productWithDetails.variations?.map(
					(variation: ProductVariationWithAttributes) => ({
						id: variation.id.toString(),
						sku: variation.sku,
						price: variation.price,
						stock: variation.stock,
						sort: variation.sort ?? 0, // Handle null sort values
						shippingFrom: variation.shippingFrom || undefined,
						attributes: variation.attributes || [],
					}),
				) || [];

			// Determine if slug is custom (doesn't match auto-generated)
			const isCustomSlug =
				productWithDetails.slug !== generateSlug(productWithDetails.name);

			setEditFormData({
				name: productWithDetails.name,
				slug: productWithDetails.slug,
				description: productWithDetails.description || "",
				price: productWithDetails.price.toString(),
				categorySlug: productWithDetails.categorySlug || "",
				brandSlug: productWithDetails.brandSlug || "",
				stock: productWithDetails.stock.toString(),
				isActive: productWithDetails.isActive,
				isFeatured: productWithDetails.isFeatured,
				discount: productWithDetails.discount,
				hasVariations: productWithDetails.hasVariations,
				weight: productWithDetails.weight || "",
				images: productWithDetails.images || "",
				shippingFrom: productWithDetails.shippingFrom || "",
				variations: [],
			});

			// Set auto-slug state based on whether slug is custom
			setIsEditAutoSlug(!isCustomSlug);

			// Set the variations separately
			setEditVariations(formattedVariations);
		} catch (error) {
			console.error("Error fetching product details:", error);
			toast.error("Failed to load product details");

			// Fallback to basic product data from the list
			setEditFormData({
				name: product.name,
				slug: product.slug,
				description: product.description || "",
				price: product.price.toString(),
				categorySlug: product.categorySlug || "",
				brandSlug: product.brandSlug || "",
				stock: product.stock.toString(),
				isActive: product.isActive,
				isFeatured: product.isFeatured,
				discount: product.discount,
				hasVariations: product.hasVariations,
				weight: product.weight || "",
				images: product.images || "",
				shippingFrom: product.shippingFrom || "",
				variations: [],
			});
			setEditVariations([]);
		}
	};

	return (
		<div>
			{/* Products List */}
			<div className="space-y-6">
				{/* Products Header with Search and Total Weight */}
				<div className="space-y-4 px-4">
					{/* Top row: Product stats and search */}
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<ProductStatsCompact />

						{/* Search */}
						<SearchInput
							placeholder="Search products..."
							value={searchTerm}
							onChange={setSearchTerm}
							className="w-full sm:w-64"
						/>
					</div>
				</div>

				{displayGroupedProducts.length === 0 ? (
					<div className="text-center py-8 text-muted-foreground px-4">
						<div className="mb-4">
							<div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
								<Plus className="w-8 h-8" />
							</div>
						</div>
						<h3 className="text-lg font-medium mb-2">
							{searchTerm ? "No products found" : "No products yet"}
						</h3>
						<p className="text-sm text-muted-foreground">
							{searchTerm
								? "Try adjusting your search"
								: "Get started by creating your first product"}
						</p>
					</div>
				) : (
					<div className="space-y-8">
						{displayGroupedProducts.map((group) => (
							<div key={group.title} className="space-y-4">
								{/* Group Title */}
								<div className="px-4">
									<h2 className="text-2xl font-semibold text-foreground flex items-baseline gap-1">
										{group.title}
										<span className="text-sm text-muted-foreground">
											{group.products.length}{" "}
											{group.products.length === 1 ? "product" : "products"}
										</span>
									</h2>
								</div>

								{/* Products Grid */}
								<div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 md:gap-3 px-4">
									{group.products.map((product) => (
										<AdminProductCard
											key={product.id}
											product={product}
											onEdit={handleEdit}
											onDelete={handleDeleteClick}
											formatPrice={formatPrice}
										/>
									))}
								</div>

								{/* No divider between groups */}
							</div>
						))}
					</div>
				)}
			</div>

			{/* Replace Edit Modal with Drawer */}
			<DashboardFormDrawer
				isOpen={showEditModal}
				onOpenChange={setShowEditModal}
				title="Edit Product"
				formId={editProductFormId}
				isSubmitting={isSubmitting}
				submitButtonText="Update Product"
				submittingText="Updating..."
				onCancel={closeEditModal}
				error={error && isEditMode ? error : undefined}
				layout="two-column"
			>
				<form
					onSubmit={handleUpdate}
					id={editProductFormId}
					className="contents"
				>
					{/* Left Column - Images, Settings, Description */}
					<div className="space-y-4 flex flex-col">
						{/* Product Images Block */}
						<DrawerSection variant="default">
							<ImageUpload
								currentImages={editFormData.images}
								onImagesChange={handleEditImagesChange}
								slug={editFormData.slug}
							/>
						</DrawerSection>

						{/* Settings Block */}
						<DrawerSection variant="default" title="Settings">
							<ProductSettingsFields
								isActive={editFormData.isActive}
								isFeatured={editFormData.isFeatured}
								discount={editFormData.discount}
								hasVariations={editFormData.hasVariations}
								onIsActiveChange={handleEditChange}
								onIsFeaturedChange={handleEditChange}
								onDiscountChange={handleEditChange}
								onHasVariationsChange={handleEditChange}
								idPrefix="edit"
							/>
						</DrawerSection>

						{/* Description Block - flex-1 to take remaining space */}
						<DrawerSection
							variant="default"
							className="flex-1"
							style={{ minHeight: "7rem" }}
						>
							<DescriptionField
								name="description"
								value={editFormData.description}
								onChange={handleEditChange}
								className="h-full"
							/>
						</DrawerSection>
					</div>

					{/* Right Column - Basic Info and Categories */}
					<DrawerSection variant="default" title="Basic Information">
						<div className="grid grid-cols-1 gap-4">
							<Input
								label="Название"
								type="text"
								name="name"
								value={editFormData.name}
								onChange={handleEditChange}
								required
							/>
							<SlugField
								slug={editFormData.slug}
								name={editFormData.name}
								isAutoSlug={isEditAutoSlug}
								onSlugChange={(slug) => {
									setIsEditAutoSlug(false);
									setEditFormData((prev) => ({ ...prev, slug }));
								}}
								onAutoSlugChange={(isAuto) => {
									setIsEditAutoSlug(isAuto);
									if (isAuto && editFormData.name) {
										const generated = generateSlug(editFormData.name);
										setEditFormData((prev) => ({ ...prev, slug: generated }));
									}
								}}
								idPrefix="edit"
							/>

							{/* Two column layout for basic information fields */}
							<div className="grid grid-cols-2 gap-4">
								{/* Column 1: Price, Category, Weight */}
								<div>
									<Input
										id={editPriceId}
										type="number"
										name="price"
										label="Цена р"
										value={editFormData.price}
										onChange={handleEditChange}
										step="0.01"
										required
									/>
								</div>

								{/* Column 2: Stock */}
								<div>
									<Input
										id={editStockId}
										type="number"
										name="stock"
										label="Количество"
										value={editFormData.stock}
										onChange={handleEditChange}
										required
									/>
								</div>

								{/* Column 1: Category */}
								<div>
									<label
										htmlFor={editCategoryId}
										className="block text-sm font-medium mb-1"
									>
										Category
									</label>
									<Select
										name="categorySlug"
										value={editFormData.categorySlug}
										onValueChange={(value: string) =>
											handleEditChange({
												target: { name: "categorySlug", value },
											} as React.ChangeEvent<HTMLSelectElement>)
										}
										required
									>
										<SelectTrigger id={editCategoryId}>
											<SelectValue placeholder="Select a category" />
										</SelectTrigger>
										<SelectContent>
											{categories.map((category) => (
												<SelectItem key={category.slug} value={category.slug}>
													{category.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								{/* Column 2: Brand */}
								<div>
									<label
										htmlFor={editBrandId}
										className="block text-sm font-medium mb-1"
									>
										Brand (optional)
									</label>
									<Select
										name="brandSlug"
										value={editFormData.brandSlug || undefined}
										onValueChange={(value: string) =>
											handleEditChange({
												target: {
													name: "brandSlug",
													value: value || null,
												},
											} as React.ChangeEvent<HTMLSelectElement>)
										}
									>
										<SelectTrigger id={editBrandId}>
											<SelectValue placeholder="Select a brand (optional)" />
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

								{/* Column 1: Weight */}
								<div>
									<Input
										id={editWeightId}
										type="text"
										name="weight"
										label="Вес (в граммах)"
										value={editFormData.weight}
										onChange={handleEditChange}
										placeholder="Enter weight in grams"
									/>
								</div>

								{/* Column 2: Ships From */}
								<div className="w-24">
									<label
										htmlFor={editShipsFromId}
										className="block text-sm font-medium mb-1"
									>
										Ships From
									</label>
									<Select
										name="shippingFrom"
										value={editFormData.shippingFrom || "NONE"}
										onValueChange={(value: string) =>
											handleEditChange({
												target: {
													name: "shippingFrom",
													value: value === "NONE" ? "" : value,
												},
											} as React.ChangeEvent<HTMLSelectElement>)
										}
									>
										<SelectTrigger id={editShipsFromId} className="w-24">
											<SelectValue placeholder="Choose shipping location">
												{getCountryFlag(
													editFormData.shippingFrom || undefined,
												) || ""}
											</SelectValue>
										</SelectTrigger>
										<SelectContent>
											{SHIPPING_COUNTRIES.map((code) => (
												<SelectItem key={code} value={code}>
													{getCountryName(code)}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>
						</div>

					</DrawerSection>

					{/* Variations Block */}
					{editFormData.hasVariations && (
						<DrawerSection variant="default" className="lg:col-span-2">
							<ProductVariationForm
								variations={editVariations}
								onChange={handleEditVariationsChange}
							/>
						</DrawerSection>
					)}
				</form>
			</DashboardFormDrawer>

			{/* Create Product Drawer */}
			<DashboardFormDrawer
				isOpen={showCreateForm}
				onOpenChange={setShowCreateForm}
				title="Add New Product"
				formId={createProductFormId}
				isSubmitting={isSubmitting}
				submitButtonText="Create Product"
				submittingText="Creating..."
				onCancel={closeCreateModal}
				error={error && !isEditMode ? error : undefined}
				layout="two-column"
			>
				<form
					onSubmit={handleSubmit}
					id={createProductFormId}
					className="contents"
				>
					{/* Left Column - Images, Settings, Description */}
					<div className="space-y-4 flex flex-col">
						{/* Product Images Block */}
						<DrawerSection variant="default">
							<ImageUpload
								currentImages={formData.images}
								onImagesChange={handleImagesChange}
								slug={formData.slug}
							/>
						</DrawerSection>

						{/* Settings Block */}
						<DrawerSection variant="default" title="Settings">
							<ProductSettingsFields
								isActive={formData.isActive}
								isFeatured={formData.isFeatured}
								discount={formData.discount}
								hasVariations={formData.hasVariations}
								onIsActiveChange={handleChange}
								onIsFeaturedChange={handleChange}
								onDiscountChange={handleChange}
								onHasVariationsChange={handleChange}
								idPrefix="add"
							/>
						</DrawerSection>

						{/* Description Block - flex-1 to take remaining space */}
						<DrawerSection
							variant="default"
							className="flex-1"
							style={{ minHeight: "7rem" }}
						>
							<DescriptionField
								name="description"
								value={formData.description}
								onChange={handleChange}
								className="h-full"
							/>
						</DrawerSection>
					</div>

					{/* Right Column - Basic Info and Categories */}
					<DrawerSection variant="default" title="Basic Information">
						<div className="grid grid-cols-1 gap-4">
							<Input
								label="Название товара"
								type="text"
								name="name"
								value={formData.name}
								onChange={handleChange}
								required
								className={
									hasAttemptedSubmit && !formData.name ? "border-red-500" : ""
								}
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
								className={
									hasAttemptedSubmit && !formData.slug ? "border-red-500" : ""
								}
								idPrefix="create"
							/>

							{/* Two column layout for basic information fields */}
							<div className="grid grid-cols-2 gap-4">
								{/* Column 1: Price, Category, Weight */}
								<div>
									<Input
										id={addPriceId}
										type="number"
										name="price"
										label="Цена р"
										value={formData.price}
										onChange={handleChange}
										required
										step="0.01"
										min="0"
										className={cn(
											hasAttemptedSubmit && !formData.price
												? "border-red-500"
												: "",
										)}
									/>
								</div>

								{/* Column 2: Stock */}
								<Input
									label="Количество"
									type="number"
									name="stock"
									value={formData.stock}
									onChange={handleChange}
									min="0"
								/>

								{/* Column 1: Category */}
								<div>
									<label
										htmlFor={addCategoryId}
										className="block text-sm font-medium mb-1"
									>
										Category
									</label>
									<Select
										value={formData.categorySlug}
										onValueChange={(value) => {
											setFormData({
												...formData,
												categorySlug: value,
											});
										}}
										required
									>
										<SelectTrigger
											id={addCategoryId}
											className={
												hasAttemptedSubmit && !formData.categorySlug
													? "border-red-500"
													: ""
											}
										>
											<SelectValue placeholder="Select a category" />
										</SelectTrigger>
										<SelectContent>
											{categories.map((category: Category) => (
												<SelectItem key={category.slug} value={category.slug}>
													{category.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								{/* Column 2: Brand */}
								<div>
									<label
										htmlFor={addBrandId}
										className="block text-sm font-medium mb-1"
									>
										Brand (optional)
									</label>
									<Select
										value={formData.brandSlug || undefined}
										onValueChange={(value) => {
											setFormData({
												...formData,
												brandSlug: value || null,
											});
										}}
									>
										<SelectTrigger id={addBrandId}>
											<SelectValue placeholder="Select a brand (optional)" />
										</SelectTrigger>
										<SelectContent>
											{brands.map((brand: Brand) => (
												<SelectItem key={brand.slug} value={brand.slug}>
													{brand.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								{/* Column 1: Weight */}
								<Input
									label="Вес (в граммах)"
									type="text"
									name="weight"
									value={formData.weight}
									onChange={handleChange}
									placeholder="Enter weight in grams"
								/>

								{/* Column 2: Ships From */}
								<div className="w-24">
									<label
										htmlFor={addShipsFromId}
										className="block text-sm font-medium mb-1"
									>
										Ships From
									</label>
									<Select
										value={formData.shippingFrom || "NONE"}
										onValueChange={(value) => {
											setFormData({
												...formData,
												shippingFrom: value === "NONE" ? "" : value,
											});
										}}
									>
										<SelectTrigger id={addShipsFromId} className="w-24">
											<SelectValue placeholder="Shipping from...">
												{getCountryFlag(formData.shippingFrom || undefined) ||
													""}
											</SelectValue>
										</SelectTrigger>
										<SelectContent>
											{SHIPPING_COUNTRIES.map((code) => (
												<SelectItem key={code} value={code}>
													{getCountryName(code)}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>
						</div>

					</DrawerSection>

					{/* Variations Block */}
					{formData.hasVariations && (
						<DrawerSection variant="default" className="lg:col-span-2">
							<ProductVariationForm
								variations={variations}
								onChange={handleVariationsChange}
							/>
						</DrawerSection>
					)}
				</form>
			</DashboardFormDrawer>

			{/* Delete Confirmation Dialog */}
			{showDeleteDialog && (
				<DeleteConfirmationDialog
					isOpen={showDeleteDialog}
					onClose={handleDeleteCancel}
					onConfirm={handleDeleteConfirm}
					title="Delete Product"
					description="Are you sure you want to delete this product? This action cannot be undone."
					isDeleting={isDeleting}
				/>
			)}
		</div>
	);
}
