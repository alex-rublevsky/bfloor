import {
  PUBLIC_TURSO_DATABASE_URL,
  SECRET_TURSO_AUTH_TOKEN,
} from "astro:env/server";
import { drizzle } from "drizzle-orm/libsql";

import { relations } from "./relations";


export const db = drizzle({
  connection: {
    url: PUBLIC_TURSO_DATABASE_URL,
    authToken: SECRET_TURSO_AUTH_TOKEN,
  },
  relations,
});
