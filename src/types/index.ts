import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type {
	brands,
	categories,
	orderItems,
	orders,
	products,
	productVariations,
} from "~/schema";

// Products
export interface Product extends InferSelectModel<typeof products> {}
export type NewProduct = InferInsertModel<typeof products>;

// Product variation with attributes
export interface ProductVariationWithAttributes extends ProductVariation {
	attributes: VariationAttribute[];
}

// Extended product type with variations
export interface ProductWithVariations extends Product {
	variations?: ProductVariationWithAttributes[];
}

// Product group for dashboard
export interface ProductGroup {
	title: string;
	products: ProductWithVariations[];
	categorySlug?: string;
}

// Categories
export type Category = InferSelectModel<typeof categories>;
export type NewCategory = InferInsertModel<typeof categories>;

// Categories with count (for filtering)
export interface CategoryWithCount extends Category {
	count: number;
}

// Brands
export type Brand = InferSelectModel<typeof brands>;
export type NewBrand = InferInsertModel<typeof brands>;

// Product Variations
export type ProductVariation = InferSelectModel<typeof productVariations>;
export type NewProductVariation = InferInsertModel<typeof productVariations>;

// Variation Attributes
export interface VariationAttribute {
	id?: number;
	productVariationId?: number;
	attributeId: string;
	value: string;
	createdAt?: string;
	updatedAt?: string;
}

export interface NewVariationAttribute {
	attributeId: string;
	value: string;
}

// Orders
export type Order = InferSelectModel<typeof orders>;
export type NewOrder = InferInsertModel<typeof orders>;

// Order Items
export type OrderItem = InferSelectModel<typeof orderItems>;
export type NewOrderItem = InferInsertModel<typeof orderItems>;


// Form data types for frontend components
export interface ProductFormData {
	name: string;
	slug: string;
	description: string;
	price: string;
	categorySlug: string;
	brandSlug: string | null;
	stock: string;
	isActive: boolean;
	isFeatured: boolean;
	discount: number | null;
	hasVariations: boolean;
	weight: string;
	images: string;
	shippingFrom?: string; // Location where this product ships from
	variations: ProductVariationFormData[];
}

export interface ProductVariationFormData {
	id?: number;
	sku: string;
	price: string;
	stock: string;
	discount?: number | null; // Add discount field
	sort: number;
	shippingFrom?: string; // Country code for shipping origin
	attributes: VariationAttributeFormData[];
}

export interface VariationAttributeFormData {
	attributeId: string;
	value: string;
}

export interface CategoryFormData {
	name: string;
	slug: string;
	image: string;
	isActive: boolean;
}

export interface BrandFormData {
	name: string;
	slug: string;
	logo: string;
	isActive: boolean;
}


// API Response Types
export interface ApiResponse<T> {
	data?: T;
	message?: string;
	error?: string;
	[key: string]: unknown;
}

export interface ProductsResponse extends ApiResponse<Product[]> {
	products?: Product[];
}

export interface ProductResponse extends ApiResponse<Product> {
	product?: Product;
}

export interface CategoriesResponse extends ApiResponse<Category[]> {
	categories?: Category[];
}

export interface CategoryResponse extends ApiResponse<Category> {
	category?: Category;
}

export interface BrandsResponse extends ApiResponse<Brand[]> {
	brands?: Brand[];
}

export interface BrandResponse extends ApiResponse<Brand> {
	brand?: Brand;
}

/**
 * Minimal CartItem - only IDs and quantity
 * All other data (price, image, stock, etc.) is looked up from TanStack Query cache
 * This eliminates data duplication and ensures we always show current data
 */
export interface CartItem {
	productId: number;
	variationId?: number;
	quantity: number;
	addedAt: number; // Timestamp for sorting/debugging
}

export interface ProductWithDetails extends Product {
	category?: {
		name: string;
		slug: string;
	} | null;
	brand?: {
		name: string;
		slug: string;
	} | null;
	variations?: ProductVariationWithAttributes[];
}
