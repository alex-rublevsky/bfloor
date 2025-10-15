#!/usr/bin/env tsx

import { execSync } from "node:child_process";
import * as fs from "node:fs";

// Colors for console output
const colors = {
	reset: "\x1b[0m",
	red: "\x1b[31m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	blue: "\x1b[34m",
	magenta: "\x1b[35m",
	cyan: "\x1b[36m",
};

// Check if we're targeting the remote database
const isRemote = process.argv.includes("--remote");
const DB_NAME = "rublevsky-studio-storage";
const WRANGLER_CONFIG = "wrangler.toml";

console.log(
	`${colors.cyan}🧹 Starting ${isRemote ? "remote" : "local"} database reset process...${colors.reset}`,
);

function updateWranglerConfig(databaseId: string) {
	console.log(
		`${colors.blue}Updating wrangler.toml with database ID: ${databaseId}${colors.reset}`,
	);

	// Read current wrangler.toml
	const wranglerContent = fs.readFileSync(WRANGLER_CONFIG, "utf-8");

	// Replace the database_id in the wrangler.toml file
	const updatedContent = wranglerContent.replace(
		/database_id = "[^"]+"/,
		`database_id = "${databaseId}"`,
	);

	// Write the updated content back
	fs.writeFileSync(WRANGLER_CONFIG, updatedContent);
	console.log(`${colors.green}✅ Updated wrangler.toml${colors.reset}`);
}

function getDatabaseInfo() {
	try {
		console.log(`${colors.blue}Getting database info...${colors.reset}`);
		const output = execSync(`npx wrangler d1 info ${DB_NAME}`, {
			encoding: "utf-8",
		});
		return output;
	} catch (_error) {
		return null;
	}
}

async function resetDatabase() {
	try {
		if (isRemote) {
			// Step 1: Check if database exists
			const dbInfo = getDatabaseInfo();

			// Step 2: Delete the existing database if found
			if (dbInfo) {
				console.log(
					`${colors.yellow}Found existing database, deleting...${colors.reset}`,
				);
				try {
					execSync(`npx wrangler d1 delete ${DB_NAME} --skip-confirmation`, {
						stdio: "inherit",
					});
					console.log(`${colors.green}✅ Database deleted${colors.reset}`);
				} catch (_error) {
					// If delete fails, force delete by name
					console.log(
						`${colors.yellow}Standard delete failed, trying force delete...${colors.reset}`,
					);
					execSync(`npx wrangler d1 delete ${DB_NAME} -f`, {
						stdio: "inherit",
					});
					console.log(
						`${colors.green}✅ Database force deleted${colors.reset}`,
					);
				}
			} else {
				console.log(
					`${colors.blue}No existing database found via info command${colors.reset}`,
				);
				// Try force delete anyway just to be sure
				try {
					console.log(
						`${colors.yellow}Attempting force delete to ensure clean slate...${colors.reset}`,
					);
					execSync(`npx wrangler d1 delete ${DB_NAME} -f`, {
						stdio: "inherit",
					});
				} catch (_error) {
					// Ignore errors here as the database might not exist
				}
			}

			// Step 3: Create a new database
			console.log(`${colors.yellow}Creating new database...${colors.reset}`);
			const createOutput = execSync(`npx wrangler d1 create ${DB_NAME}`, {
				encoding: "utf-8",
			});

			// Step 4: Extract the new database ID
			const idMatch = createOutput.match(/database_id = "([^"]+)"/);
			if (!idMatch) {
				throw new Error("Could not find database ID in creation output");
			}
			const newDatabaseId = idMatch[1];
			console.log(
				`${colors.green}✅ Created new database with ID: ${newDatabaseId}${colors.reset}`,
			);

			// Step 5: Update wrangler.toml with the new ID
			updateWranglerConfig(newDatabaseId);

			console.log(
				`${colors.green}🎉 Remote database reset completed!${colors.reset}`,
			);
			console.log(`${colors.magenta}ℹ️ Next steps:${colors.reset}`);
			console.log(
				`${colors.magenta}1. Generate migrations (pnpm db:generate)${colors.reset}`,
			);
			console.log(
				`${colors.magenta}2. Apply migrations to remote database (pnpm db:migrate:prod)${colors.reset}`,
			);
			console.log(
				`${colors.magenta}3. Seed the database if needed (pnpm db:seed:prod)${colors.reset}`,
			);
		} else {
			// For local database, we'll delete the directories
			const paths = ["./.wrangler/state/v3/d1", "./drizzle"];

			for (const path of paths) {
				try {
					console.log(`${colors.yellow}Deleting ${path}...${colors.reset}`);
					execSync(`rm -rf "${path}"`, { stdio: "inherit" });
					console.log(
						`${colors.green}✅ Successfully deleted ${path}${colors.reset}`,
					);
				} catch (_error) {
					console.log(
						`${colors.blue}ℹ️ ${path} not found or already deleted${colors.reset}`,
					);
				}
			}

			console.log(
				`${colors.green}🎉 Local database reset completed!${colors.reset}`,
			);
		}
	} catch (error) {
		console.error(`${colors.red}❌ Database reset failed${colors.reset}`);
		if (error instanceof Error) {
			console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
		}
		process.exit(1);
	}
}

resetDatabase();
