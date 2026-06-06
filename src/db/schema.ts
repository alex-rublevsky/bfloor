import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core";

export const categories = sqliteTable("categories", {
  id: integer().primaryKey(),
  name: text().unique().notNull(),
  slug: text().unique().notNull(),
  sort: integer(),
});
export const categoryRelations = relations(categories, ({ many }) => ({
  brand: many(brands),
  product: many(products),
}));

export const brands = sqliteTable("brands", {
  id: integer().primaryKey(),
  name: text().notNull(),
  slug: text().unique().notNull(),
  categoryId: integer().notNull(),
});

export const brandRelations = relations(brands, ({ one, many }) => ({
  category: one(categories, {
    fields: [brands.categoryId],
    references: [categories.id],
  }),
  collection: many(collections),
  product: many(products),
}));

export const collections = sqliteTable("collections", {
  id: integer().primaryKey(),
  name: text().notNull(),
  slug: text().unique().notNull(),
  brandId: integer().notNull(),
});

export const collectionRelations = relations(collections, ({ one, many }) => ({
  brand: one(brands, {
    fields: [collections.brandId],
    references: [brands.id],
  }),
  product: many(products),
}));

export const products = sqliteTable("products", {
  id: integer().primaryKey(),
  name: text("name").unique().notNull(),
  slug: text("slug").unique().notNull(),
  images: text("images", { mode: "json" })
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'`),
  price: real("price").notNull().default(0),
  discountedPrice: real("discounted_price"),
  categoryId: integer("category_id").notNull(),
  brandId: integer("brand_id"),
  collectionId: integer("collection_id"),
  viewCount: integer("view_count").default(0),
  description: text(),
});

export const productRelations = relations(products, ({ one }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  brand: one(brands, {
    fields: [products.brandId],
    references: [brands.id],
  }),
  collection: one(collections, {
    fields: [products.collectionId],
    references: [collections.id],
  }),
}));

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

export const schema = {
  user,
  session,
  account,
  verification,
  products,
  // productVariations,
  // productAttributes,
  // attributeValues,
  // productAttributeValues,
  // variationAttributeValues,
  categories,
  brands,
  collections,
  // storeLocations,
  // productStoreLocations,
  // news,
};
