#!/usr/bin/env tsx
import { createClient } from "@libsql/client";
import { readFileSync } from "fs";

// Load environment variables from .dev.vars
const envContent = readFileSync(".dev.vars", "utf-8");
const envVars: Record<string, string> = {};
for (const line of envContent.split("\n")) {
	const match = line.match(/^([^=]+)=(.*)$/);
	if (match) {
		let value = match[2].trim();
		// Remove surrounding quotes if present
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}
		envVars[match[1]] = value;
	}
}

const client = createClient({
	url: envVars.TURSO_DATABASE_URL!,
	authToken: envVars.TURSO_AUTH_TOKEN!,
});

async function findProductByImage(imageName: string) {
	try {
		console.log(`\n🔍 Searching for products with image: "${imageName}"\n`);

		// Strip extension if provided to search more flexibly
		const nameWithoutExt = imageName.replace(/\.(png|jpg|jpeg|webp|gif)$/i, "");

		console.log(`   Searching for: "${imageName}" or "${nameWithoutExt}"\n`);

		// Search in images JSON field using LIKE (search for both with and without extension)
		const result = await client.execute({
			sql: "SELECT id, slug, name, images FROM products WHERE images LIKE ? OR images LIKE ?",
			args: [`%${imageName}%`, `%${nameWithoutExt}%`],
		});

		if (result.rows.length === 0) {
			console.log("❌ No products found with this image.\n");

			// Try to find similar images by extracting just the base filename
			const baseFilename =
				imageName
					.split("/")
					.pop()
					?.replace(/\.(png|jpg|jpeg|webp|gif)$/i, "") || imageName;

			if (baseFilename !== imageName && baseFilename !== nameWithoutExt) {
				console.log(
					`🔍 Searching for similar images with "${baseFilename}"...\n`,
				);

				const similarResult = await client.execute({
					sql: "SELECT slug, name, images FROM products WHERE images LIKE ? LIMIT 5",
					args: [`%${baseFilename}%`],
				});

				if (similarResult.rows.length > 0) {
					console.log(
						`💡 Found ${similarResult.rows.length} product(s) with similar filename:\n`,
					);

					for (const row of similarResult.rows) {
						console.log(`📦 ${row.slug}`);
						if (row.images) {
							try {
								const images = JSON.parse(row.images as string);
								const matchingImages = images.filter((img: string) =>
									img.includes(baseFilename),
								);
								console.log(`   Images: ${matchingImages.join(", ")}`);
							} catch (e) {
								console.log(`   Images: ${row.images}`);
							}
						}
						console.log("");
					}
					return;
				}
			}

			console.log("💡 Tips:");
			console.log('   - Images are stored as paths like "2024/01/image.webp"');
			console.log(
				'   - Try searching without path: "302" instead of "2024/01/302.png"',
			);
			console.log('   - Try searching with just the filename: "1849-1"\n');
			return;
		}

		console.log(`✅ Found ${result.rows.length} product(s):\n`);

		for (const row of result.rows) {
			console.log(`📦 Product ID: ${row.id}`);
			console.log(`   Slug: ${row.slug}`);
			console.log(`   Name: ${row.name}`);

			if (row.images) {
				try {
					const images = JSON.parse(row.images as string);
					console.log(`   Images (${images.length} total):`);

					// Highlight the matching image
					for (const img of images) {
						const isMatch = img.includes(imageName);
						const prefix = isMatch ? "   👉 " : "      ";
						console.log(`${prefix}${img}`);
					}
				} catch (e) {
					console.log(`   Images (raw): ${row.images}`);
				}
			} else {
				console.log("   Images: (none)");
			}

			console.log("");
		}
	} catch (error) {
		console.error("❌ Error:", error);
		process.exit(1);
	} finally {
		client.close();
	}
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
	console.error(`
Usage: pnpm tsx find-product-by-image.ts <image-name>

Examples:
  pnpm tsx find-product-by-image.ts "1849-1.jpeg"
  pnpm tsx find-product-by-image.ts "oak-brown"
  pnpm tsx find-product-by-image.ts "IM1849"

The script will search for any product whose images JSON contains the given string.
  `);
	process.exit(1);
}

const imageName = args[0];
findProductByImage(imageName);
