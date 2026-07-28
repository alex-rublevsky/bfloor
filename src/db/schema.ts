import { sql } from "drizzle-orm";
import {
  integer,
  real,
  sqliteTable,
  text
} from "drizzle-orm/sqlite-core";

export const categories = sqliteTable("categories", {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().unique().notNull(),
  slug: text().unique().notNull(),
  // sort: integer(),
});


export const brands = sqliteTable("brands", {
  id: integer().primaryKey(),
  name: text().notNull(),
  slug: text().unique().notNull(),
  categoryId: integer().notNull(),
});



export const collections = sqliteTable("collections", {
  id: integer().primaryKey(),
  name: text().notNull(),
  slug: text().unique().notNull(),
  brandId: integer().notNull(),
});

export const products = sqliteTable("products", {
  id: integer().primaryKey(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  isFeatured: integer("is_featured", { mode: "boolean" })
    .notNull()
    .default(false),
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
  viewCount: integer("view_count").notNull().default(0),
  description: text("description"),
  importantNote: text("important_note"),
  createdAt: integer("created_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

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
