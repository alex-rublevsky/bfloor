import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core";

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").unique().notNull(),
  slug: text("slug").unique().notNull(),
  image: text("image"),
  description: text("description"),
});

export const brands = sqliteTable("brands", {
  id: integer("id").primaryKey(),
  name: text("name").unique().notNull(),
  slug: text("slug").unique().notNull(),
  countryId: integer("country_id"),
  image: text("image"),
});

export const collections = sqliteTable(
  "collections",
  {
    id: integer("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").unique().notNull(),
    brandId: integer("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "restrict" }),
  },
  (table) => [
    unique("collections_brand_name_unique").on(table.brandId, table.name),
  ],
);

export const attributes = sqliteTable("attributes", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
});

export const attributeValues = sqliteTable(
  "attribute_values",
  {
    id: integer("id").primaryKey(),
    attributeId: integer("attribute_id")
      .notNull()
      .references(() => attributes.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    normalizedName: text("normalized_name").notNull(),
    slug: text("slug").notNull(),
  },
  (table) => [
    //this is required as the parent key for the composite foreign key
    unique("attribute_values_attribute_id_id_unique").on(
      table.attributeId,
      table.id,
    ),
    //this prevents duplicate names
    unique("attribute_values_attribute_normalized_name_unique").on(
      table.attributeId,
      table.normalizedName,
    ),
    //TODO: should this be removed, would name be enough?
    //this prevents duplicate slugs
    unique("attribute_values_attribute_slug_unique").on(
      table.attributeId,
      table.slug,
    ),
  ],
);

export const products = sqliteTable(
  "products",
  {
    id: integer("id").primaryKey(),
    sku: text("sku"),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    name: text("name").unique().notNull(),
    slug: text("slug").unique().notNull(),
    images: text("images", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'`),
    price: real("price"),
    discountedPrice: real("discounted_price"),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    brandId: integer("brand_id").references(() => brands.id, {
      onDelete: "restrict",
    }),
    collectionId: integer("collection_id").references(() => collections.id, {
      onDelete: "restrict",
    }),
    unitOfMeasurement: text("unit_of_measurement").notNull().default("м2"),
    viewCount: integer("view_count").notNull().default(0),
    description: text("description"),
    importantNote: text("important_note"),
    createdAt: integer("created_at", { mode: "timestamp" }),
    updatedAt: integer("updated_at", { mode: "timestamp" }),
  },
  (table) => [
    check(
      "unitOfMeasurementCheck",
      sql`${table.unitOfMeasurement} IN ('м2', 'lm', 'pi', 'pa', 'l')`,
    ),
    unique("products_sku_brandId_unique").on(table.sku, table.brandId),

    //for dashboard, where we show both active and inactive products
    //TODO: or remove this and add a toggle of active to the dashboard filters?
    index("products_categoryId_viewCount_idx").on(
      table.categoryId,
      table.viewCount,
    ),

    //for storefront, where we show only active products
    index("products_categoryId_isActive_viewCount_idx").on(
      table.categoryId,
      table.isActive,
      table.viewCount,
    ),

    //TODO: should these indexes be merged, considering that
    // the collection would be able to be picked ONLY after a brand is selected?
    index("products_brandId_idx").on(table.brandId),
    index("products_collectionId_idx").on(table.collectionId),
  ],
);

export const variations = sqliteTable(
  "variations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    // TODO: add image id's to switch the gallery to the relevant image
    price: real("price").notNull().default(0),
    discountedPrice: real("discounted_price"),
    createdAt: integer("created_at", { mode: "timestamp" }),
    updatedAt: integer("updated_at", { mode: "timestamp" }),
  },
  (table) => [index("variations_productId_idx").on(table.productId)],
);

export const productStoreLocations = sqliteTable(
  "product_store_locations",
  {
    productId: integer("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    storeLocationId: integer("store_location").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.storeLocationId, table.productId] }),
    index("product_storeLocations_idx").on(
      table.productId,
      table.storeLocationId,
    ),
    check(
      "product_storeLocationId_check",
      sql`${table.storeLocationId} IN (0, 1, 2)`,
    ),
  ],
);

export const productAttributeValues = sqliteTable(
  "product_attribute_values",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    productId: integer("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    attributeId: integer("attribute_id")
      .references(() => attributes.id, {
        onDelete: "restrict",
      })
      .notNull(),
    attributeValueId: integer("attribute_value_id").notNull(),
  },
  (table) => [
    foreignKey({
      name: "product_attribute_values_attribute_value_fk",
      columns: [table.attributeId, table.attributeValueId],
      foreignColumns: [attributeValues.attributeId, attributeValues.id],
    }),
    unique("product_attribute_values_unique").on(
      table.productId,
      table.attributeId,
      table.attributeValueId,
    ),

    //TODO: should this index include categoryId as the first value,
    // since searching by attributeId/value is only possible within a category?
    index("product_attributeId_attributeValueId_idx").on(
      table.attributeId,
      table.attributeValueId,
    ),
  ],
);

export const variationAttributeValues = sqliteTable(
  "variation_attribute_values",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    variationId: integer("variation_id")
      .references(() => variations.id, { onDelete: "cascade" })
      .notNull(),
    attributeId: integer("attribute_id")
      .references(() => attributes.id, { onDelete: "restrict" })
      .notNull(),
    attributeValueId: integer("attribute_value_id").notNull(),
  },
  (table) => [
    foreignKey({
      name: "variation_attribute_values_attribute_value_fk",
      columns: [table.attributeId, table.attributeValueId],
      foreignColumns: [attributeValues.attributeId, attributeValues.id],
    }),
    unique("variation_attribute_unique").on(
      table.variationId,
      table.attributeId,
    ),

    //TODO: rethink this setup. what are the use cases? since productAttributeValues would perhaps
    // include a categoryId, this variationsAttributeValues would either include ProductId or variationId or categoryId (how?)?
    index("variation_attributeId_attributeValueId_idx").on(
      table.attributeId,
      table.attributeValueId,
    ),
  ],
);

// Auth tables
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
