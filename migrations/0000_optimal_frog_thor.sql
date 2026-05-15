CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `attribute_values` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`attribute_id` integer NOT NULL,
	`value` text NOT NULL,
	`slug` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`attribute_id`) REFERENCES `product_attributes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_attribute_values_attribute_id` ON `attribute_values` (`attribute_id`);--> statement-breakpoint
CREATE INDEX `idx_attribute_values_attribute_active` ON `attribute_values` (`attribute_id`,`is_active`);--> statement-breakpoint
CREATE INDEX `idx_attribute_values_attribute_sort` ON `attribute_values` (`attribute_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `brands` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`image` text,
	`country_id` integer,
	`is_active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `brands_slug_unique` ON `brands` (`slug`);--> statement-breakpoint
CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`parent_slug` text,
	`image` text,
	`is_active` integer DEFAULT true NOT NULL,
	`order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_slug_unique` ON `categories` (`slug`);--> statement-breakpoint
CREATE TABLE `collections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`brand_slug` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`brand_slug`) REFERENCES `brands`(`slug`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `collections_slug_unique` ON `collections` (`slug`);--> statement-breakpoint
CREATE TABLE `news` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`image` text,
	`body` text,
	`published_at` integer,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `news_slug_unique` ON `news` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_news_active` ON `news` (`is_active`);--> statement-breakpoint
CREATE INDEX `idx_news_active_published` ON `news` (`is_active`,`published_at`);--> statement-breakpoint
CREATE INDEX `idx_news_slug` ON `news` (`slug`);--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`orderId` integer NOT NULL,
	`productId` integer NOT NULL,
	`productVariationId` integer,
	`quantity` integer NOT NULL,
	`unitAmount` real NOT NULL,
	`discountPercentage` integer,
	`finalAmount` real NOT NULL,
	`attributes` text,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`productVariationId`) REFERENCES `product_variations`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_order_items_order_id` ON `order_items` (`orderId`);--> statement-breakpoint
CREATE INDEX `idx_order_items_product_id` ON `order_items` (`productId`);--> statement-breakpoint
CREATE INDEX `idx_order_items_variation_id` ON `order_items` (`productVariationId`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`subtotalAmount` real NOT NULL,
	`discountAmount` real DEFAULT 0 NOT NULL,
	`shippingAmount` real DEFAULT 0 NOT NULL,
	`totalAmount` real NOT NULL,
	`currency` text DEFAULT 'CAD' NOT NULL,
	`paymentMethod` text,
	`paymentStatus` text DEFAULT 'pending' NOT NULL,
	`shippingMethod` text,
	`notes` text,
	`createdAt` integer NOT NULL,
	`completedAt` integer
);
--> statement-breakpoint
CREATE INDEX `idx_orders_created_at` ON `orders` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_orders_status_created` ON `orders` (`status`,`createdAt`);--> statement-breakpoint
CREATE TABLE `product_attribute_values` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`attribute_id` integer NOT NULL,
	`value_id` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`attribute_id`) REFERENCES `product_attributes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`value_id`) REFERENCES `attribute_values`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_product_attribute_values_product_id` ON `product_attribute_values` (`product_id`);--> statement-breakpoint
CREATE INDEX `idx_product_attribute_values_attribute_id` ON `product_attribute_values` (`attribute_id`);--> statement-breakpoint
CREATE INDEX `idx_product_attribute_values_value_id` ON `product_attribute_values` (`value_id`);--> statement-breakpoint
CREATE INDEX `idx_product_attribute_values_product_attr` ON `product_attribute_values` (`product_id`,`attribute_id`);--> statement-breakpoint
CREATE INDEX `idx_product_attribute_values_attr_value` ON `product_attribute_values` (`attribute_id`,`value_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `product_attribute_values_product_id_attribute_id_value_id_unique` ON `product_attribute_values` (`product_id`,`attribute_id`,`value_id`);--> statement-breakpoint
CREATE TABLE `product_attributes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`value_type` text DEFAULT 'free-text' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_attributes_name_unique` ON `product_attributes` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `product_attributes_slug_unique` ON `product_attributes` (`slug`);--> statement-breakpoint
CREATE TABLE `product_brands` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`brand_slug` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`brand_slug`) REFERENCES `brands`(`slug`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_product_brands_product_id` ON `product_brands` (`product_id`);--> statement-breakpoint
CREATE INDEX `idx_product_brands_brand_slug` ON `product_brands` (`brand_slug`);--> statement-breakpoint
CREATE INDEX `idx_product_brands_product_brand` ON `product_brands` (`product_id`,`brand_slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `product_brands_product_id_brand_slug_unique` ON `product_brands` (`product_id`,`brand_slug`);--> statement-breakpoint
CREATE TABLE `product_collections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`collection_slug` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`collection_slug`) REFERENCES `collections`(`slug`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_product_collections_product_id` ON `product_collections` (`product_id`);--> statement-breakpoint
CREATE INDEX `idx_product_collections_collection_slug` ON `product_collections` (`collection_slug`);--> statement-breakpoint
CREATE INDEX `idx_product_collections_product_collection` ON `product_collections` (`product_id`,`collection_slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `product_collections_product_id_collection_slug_unique` ON `product_collections` (`product_id`,`collection_slug`);--> statement-breakpoint
CREATE TABLE `product_store_locations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer,
	`store_location_id` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_product_store_locations_product_id` ON `product_store_locations` (`product_id`);--> statement-breakpoint
CREATE INDEX `idx_product_store_locations_location_id` ON `product_store_locations` (`store_location_id`);--> statement-breakpoint
CREATE INDEX `idx_product_store_locations_product_location` ON `product_store_locations` (`product_id`,`store_location_id`);--> statement-breakpoint
CREATE TABLE `product_variations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer,
	`sku` text NOT NULL,
	`price` real NOT NULL,
	`discounted_price` real,
	`sort` integer,
	`variation_attributes` text,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_variations_sku_unique` ON `product_variations` (`sku`);--> statement-breakpoint
CREATE INDEX `idx_product_variations_product_id` ON `product_variations` (`product_id`);--> statement-breakpoint
CREATE INDEX `idx_product_variations_product_sort` ON `product_variations` (`product_id`,`sort`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category_slug` text,
	`brand_slug` text,
	`collection_slug` text,
	`store_location_id` integer,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`sku` text,
	`images` text,
	`description` text,
	`important_note` text,
	`tags` text,
	`price` real DEFAULT 0 NOT NULL,
	`square_meters_per_pack` real,
	`unit_of_measurement` text DEFAULT 'м2' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`is_featured` integer DEFAULT false NOT NULL,
	`discounted_price` real,
	`has_variations` integer DEFAULT false NOT NULL,
	`product_attributes` text,
	`dimensions` text,
	`view_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`category_slug`) REFERENCES `categories`(`slug`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`brand_slug`) REFERENCES `brands`(`slug`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`collection_slug`) REFERENCES `collections`(`slug`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_slug_unique` ON `products` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_products_active` ON `products` (`is_active`);--> statement-breakpoint
CREATE INDEX `idx_products_category` ON `products` (`category_slug`,`is_active`);--> statement-breakpoint
CREATE INDEX `idx_products_brand` ON `products` (`brand_slug`,`is_active`);--> statement-breakpoint
CREATE INDEX `idx_products_collection` ON `products` (`collection_slug`,`is_active`);--> statement-breakpoint
CREATE INDEX `idx_products_price` ON `products` (`price`);--> statement-breakpoint
CREATE INDEX `idx_products_active_price` ON `products` (`is_active`,`price`);--> statement-breakpoint
CREATE INDEX `idx_products_active_name` ON `products` (`is_active`,`name`);--> statement-breakpoint
CREATE INDEX `idx_products_active_created_at` ON `products` (`is_active`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_products_active_featured_name` ON `products` (`is_active`,`is_featured`,`name`);--> statement-breakpoint
CREATE INDEX `idx_products_store_location` ON `products` (`store_location_id`,`is_active`);--> statement-breakpoint
CREATE INDEX `idx_products_has_variations` ON `products` (`has_variations`);--> statement-breakpoint
CREATE INDEX `idx_products_active_view_count` ON `products` (`is_active`,`view_count`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer NOT NULL,
	`image` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `variation_attributes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_variation_id` integer,
	`attributeId` text NOT NULL,
	`value` text NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`product_variation_id`) REFERENCES `product_variations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_variation_attributes_variation_id` ON `variation_attributes` (`product_variation_id`);--> statement-breakpoint
CREATE INDEX `idx_variation_attributes_attr_id` ON `variation_attributes` (`attributeId`);--> statement-breakpoint
CREATE INDEX `idx_variation_attributes_attr_value` ON `variation_attributes` (`attributeId`,`value`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
