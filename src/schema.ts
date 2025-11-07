import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

// System Tables

// Products and Related Tables
export const products = sqliteTable("products", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	categorySlug: text("category_slug").references(() => categories.slug, {
		onDelete: "cascade",
	}),
	brandSlug: text("brand_slug").references(() => brands.slug, {
		onDelete: "cascade",
	}),
	collectionSlug: text("collection_slug").references(() => collections.slug, {
		onDelete: "set null",
	}),
	storeLocationId: integer("store_location_id"),
	name: text("name").notNull(),
	slug: text("slug").notNull().unique(),
	sku: text("sku"), // Product SKU/Article number - optional
	images: text("images"), // JSON stored as text
	description: text("description"),
	importantNote: text("important_note"), // Важная заметка с поддержкой Markdown - опционально
	tags: text("tags"), // Теги для категоризации товаров (JSON массив) - опционально
	price: real("price").notNull().default(0), // Make price non-nullable with default value (for flooring: price per m²)
	squareMetersPerPack: real("square_meters_per_pack"), // For flooring products: area coverage per pack
	unitOfMeasurement: text("unit_of_measurement").notNull().default("штука"), // Единица количества: погонный метр, квадратный метр, литр, штука, упаковка
	isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
	isFeatured: integer("is_featured", { mode: "boolean" })
		.notNull()
		.default(false),
	discount: integer("discount"), // Percentage discount (e.g., 20 for 20% off)
	hasVariations: integer("has_variations", { mode: "boolean" })
		.notNull()
		.default(false),
	productAttributes: text("product_attributes"), // JSON stored as text
	createdAt: integer("created_at", { mode: "timestamp" }),
});

export const productVariations = sqliteTable("product_variations", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	productId: integer("product_id").references(() => products.id, {
		onDelete: "cascade",
	}),
	sku: text("sku").notNull().unique(),
	price: real("price").notNull(), // Using real for decimal in SQLite
	discount: integer("discount"), // Discount percentage for this variation
	sort: integer("sort"),
	createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
});

export const productAttributes = sqliteTable("product_attributes", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull().unique(), // Display name: "Размер (см)", "Цвет"
	slug: text("slug").notNull().unique(), // URL/SKU friendly: "size-cm", "color"
	valueType: text("value_type").notNull().default("free-text"), // 'free-text' | 'standardized' | 'both'
	allowMultipleValues: integer("allow_multiple_values", { mode: "boolean" })
		.notNull()
		.default(false),
});

export const attributeValues = sqliteTable("attribute_values", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	attributeId: integer("attribute_id")
		.references(() => productAttributes.id, { onDelete: "cascade" })
		.notNull(),
	value: text("value").notNull(), // Display value: "ПВХ плитка"
	slug: text("slug"), // Optional: "pvh-plitka" for URLs
	sortOrder: integer("sort_order").notNull().default(0),
	isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
	createdAt: integer("created_at", { mode: "timestamp" }),
});

export const variationAttributes = sqliteTable("variation_attributes", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	productVariationId: integer("product_variation_id").references(
		() => productVariations.id,
		{ onDelete: "cascade" },
	),
	attributeId: text("attributeId").notNull(), // Keep as string for backward compatibility
	value: text("value").notNull(),
	createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
});

export const categories = sqliteTable("categories", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull(),
	slug: text("slug").notNull().unique(),
	parentSlug: text("parent_slug"),
	image: text("image"),
	isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
	order: integer("order").notNull().default(0), // For sorting categories
});

export const countries = sqliteTable("countries", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull(), // Display name: "Россия", "Германия"
	code: text("code").notNull().unique(), // ISO country code: "RU", "DE", "IT", etc.
	flagImage: text("flag_image"), // Path to flag image file (optional)
	isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
	createdAt: integer("created_at", { mode: "timestamp" }),
});

export const brands = sqliteTable("brands", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull(),
	slug: text("slug").notNull().unique(),
	image: text("image"),
	countryId: integer("country_id").references(() => countries.id, {
		onDelete: "set null",
	}), // Страна происхождения бренда - опционально
	isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
});

export const collections = sqliteTable("collections", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull(),
	slug: text("slug").notNull().unique(),
	brandSlug: text("brand_slug")
		.notNull()
		.references(() => brands.slug, {
			onDelete: "cascade",
		}),
	isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
});

export const storeLocations = sqliteTable("store_locations", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	address: text("address").notNull(),
	description: text("description"),
	openingHours: text("opening_hours"),
	isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const productStoreLocations = sqliteTable("product_store_locations", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	productId: integer("product_id").references(() => products.id, {
		onDelete: "cascade",
	}),
	storeLocationId: integer("store_location_id").references(
		() => storeLocations.id,
		{
			onDelete: "cascade",
		},
	),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const orders = sqliteTable("orders", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	status: text("status").notNull().default("pending"),
	subtotalAmount: real("subtotalAmount").notNull(), // Base price before discounts
	discountAmount: real("discountAmount").notNull().default(0), // Total discounts applied
	shippingAmount: real("shippingAmount").notNull().default(0),
	totalAmount: real("totalAmount").notNull(), // Final total (subtotal - discount + shipping)
	currency: text("currency").notNull().default("CAD"),
	paymentMethod: text("paymentMethod"),
	paymentStatus: text("paymentStatus").notNull().default("pending"),
	shippingMethod: text("shippingMethod"),
	notes: text("notes"),
	createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
	completedAt: integer("completedAt", { mode: "timestamp" }),
});

export const orderItems = sqliteTable("order_items", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	orderId: integer("orderId")
		.references(() => orders.id, { onDelete: "cascade" })
		.notNull(),
	productId: integer("productId")
		.references(() => products.id, { onDelete: "cascade" })
		.notNull(),
	productVariationId: integer("productVariationId").references(
		() => productVariations.id,
		{ onDelete: "set null" },
	),
	quantity: integer("quantity").notNull(),
	unitAmount: real("unitAmount").notNull(),
	discountPercentage: integer("discountPercentage"),
	finalAmount: real("finalAmount").notNull(), // Unit amount after discount × quantity
	attributes: text("attributes"), // JSON stored as text
	createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
});

// Inquiries
// export const inquiries = sqliteTable('inquiries', {
//   id: integer('id').primaryKey({ autoIncrement: true }),
//   name: text('name').notNull(),
//   email: text('email').notNull(),
//   companyName: text('company_name'),
//   role: text('role'),
//   budget: real('budget'), // Using real for decimal in SQLite
//   message: text('message').notNull(),
//   createdAt: text('created_at'),
// });

export const user = sqliteTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: integer("email_verified", { mode: "boolean" }).notNull(),
	image: text("image"),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const session = sqliteTable("session", {
	id: text("id").primaryKey(),
	expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
	token: text("token").notNull().unique(),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
	id: text("id").primaryKey(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: integer("access_token_expires_at", {
		mode: "timestamp",
	}),
	refreshTokenExpiresAt: integer("refresh_token_expires_at", {
		mode: "timestamp",
	}),
	scope: text("scope"),
	password: text("password"),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
	createdAt: integer("created_at", { mode: "timestamp" }),
	updatedAt: integer("updated_at", { mode: "timestamp" }),
});

export const schema = {
	// Auth tables
	user,
	session,
	account,
	verification,
	// Product tables
	products,
	productVariations,
	productAttributes,
	attributeValues,
	variationAttributes,
	categories,
	countries,
	brands,
	collections,
	storeLocations,
	productStoreLocations,
	// Order tables
	orders,
	orderItems,
};
