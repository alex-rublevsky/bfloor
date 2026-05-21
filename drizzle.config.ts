import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
config({ path: ".env" });
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./migrations",
  dialect: "turso",
  tablesFilter: [
    "account",
    "attribute_values",
    "brands",
    "categories",
    "collections",
    "news",
    "order_items",
    "orders",
    "product_attribute_values",
    "product_attributes",
    "product_brands",
    "product_collections",
    "product_store_locations",
    "product_variations",
    "products",
    "session",
    "user",
    "variation_attributes",
    "verification",
  ],
  dbCredentials: {
    url: process.env.PUBLIC_TURSO_DATABASE_URL!,
    authToken: process.env.SECRET_TURSO_AUTH_TOKEN!,
  },
});
