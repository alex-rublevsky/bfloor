// ============================================================================
// TURSO DATABASE CONNECTION
// ============================================================================
// Using @libsql/client/http with drizzle-orm/sqlite-proxy
// This approach avoids native dependencies that don't work on Vercel
// drizzle-orm/libsql has native dependencies, so we use sqlite-proxy instead
// ============================================================================

import { createClient } from "@libsql/client/http";
import type { SqliteRemoteDatabase } from "drizzle-orm/sqlite-proxy";
import { drizzle as drizzleProxy } from "drizzle-orm/sqlite-proxy";
import * as schema from "~/schema";

let db: SqliteRemoteDatabase<typeof schema> | null = null;

export function DB(): SqliteRemoteDatabase<typeof schema> {
	if (!db) {
		const url = process.env.TURSO_DATABASE_URL;
		const authToken = process.env.TURSO_AUTH_TOKEN;

		if (!url) {
			throw new Error("TURSO_DATABASE_URL environment variable is required");
		}

		// Create HTTP-only client (no native dependencies)
		const client = createClient({
			url,
			authToken,
		});

		// Use sqlite-proxy adapter - works with any SQLite-compatible client
		// This avoids the native dependencies in drizzle-orm/libsql
		db = drizzleProxy(
			async (sql, params, method) => {
				try {
					if (method === "run") {
						await client.execute({ sql, args: params });
						return { rows: [] };
					}

					if (method === "all" || method === "values") {
						const result = await client.execute({ sql, args: params });
						return { rows: result.rows as unknown[] };
					}

					if (method === "get") {
						const result = await client.execute({ sql, args: params });
						return { rows: result.rows[0] ? [result.rows[0]] : [] };
					}

					return { rows: [] };
				} catch (error) {
					console.error("Database query error:", error);
					throw error;
				}
			},
			{ schema },
		);
	}

	return db;
}
