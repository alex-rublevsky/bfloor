import { env } from "cloudflare:workers";
import { type DrizzleD1Database, drizzle } from "drizzle-orm/d1";
import * as schema from "~/schema";

export function DB(): DrizzleD1Database<typeof schema> {
	return drizzle(env.DB, { schema });
}
