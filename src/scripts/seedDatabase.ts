// import { mockBlogPosts, mockProducts, mockCategories, mockBrands, mockTeaCategories } from '../data/mockData';
// import Database from 'better-sqlite3';
// import { resolve } from 'path';
// import { readdirSync, existsSync } from 'fs';
// import { drizzle } from 'drizzle-orm/d1';
// import { drizzle as drizzleSQLite } from 'drizzle-orm/better-sqlite3';
// import * as schema from '~/schema';
// import { eq } from 'drizzle-orm';
// import { execSync } from 'child_process';
// import * as fs from 'fs';
// import * as path from 'path';

// // Colors for console output
// const colors = {
//   reset: '\x1b[0m',
//   red: '\x1b[31m',
//   green: '\x1b[32m',
//   yellow: '\x1b[33m',
//   blue: '\x1b[34m',
//   magenta: '\x1b[35m',
//   cyan: '\x1b[36m',
// };

// // Check if we're targeting the remote database
// const isRemote = process.argv.includes('--remote');
// const DB_NAME = 'rublevsky-studio-storage';

// // Define available tables for seeding
// type TableName =
//   | 'tea_categories'
//   | 'categories'
//   | 'brands'
//   | 'products'
//   | 'blog_posts'
//   | 'all';

// // Define table dependencies
// const tableDependencies: Record<TableName, TableName[]> = {
//   tea_categories: [],
//   categories: [],
//   brands: [],
//   products: [],
//   blog_posts: [],
//   all: []
// };

// // Define dependent tables that need to be cleared when clearing a specific table
// const tableDependentClearMap: Record<TableName, string[]> = {
//   products: ['variation_attributes', 'product_variations', 'product_tea_categories'],
//   blog_posts: ['blog_tea_categories'],
//   tea_categories: [],
//   categories: [],
//   brands: [],
//   all: []
// };

// // Get tables to seed from command line arguments
// const tablesToSeed = process.argv
//   .filter(arg => arg.startsWith('--table='))
//   .map(arg => arg.replace('--table=', '')) as TableName[];

// // If no specific tables are specified, seed all tables
// const shouldSeedAll = tablesToSeed.length === 0 || tablesToSeed.includes('all');

// // Get the final list of tables to seed
// const finalTablesToSeed = shouldSeedAll
//   ? ['tea_categories', 'categories', 'brands', 'products', 'blog_posts']
//   : getRequiredTables(tablesToSeed);

// // Function to get all required tables including dependencies
// function getRequiredTables(tables: TableName[]): TableName[] {
//   const required = new Set<TableName>();

//   function addDependencies(table: TableName) {
//     if (!required.has(table)) {
//       required.add(table);
//       tableDependencies[table]?.forEach(dep => addDependencies(dep));
//     }
//   }

//   tables.forEach(table => addDependencies(table));
//   return Array.from(required);
// }

// // Function to find the local SQLite database file
// function findLocalDbPath() {
//   const basePath = resolve('./.wrangler/state/v3/d1/miniflare-D1DatabaseObject');

//   if (!existsSync(basePath)) {
//     console.error('❌ No SQLite database found. Make sure you have run your app locally first.');
//     process.exit(1);
//   }

//   const files = readdirSync(basePath).filter(f => f.endsWith('.sqlite'));
//   return files.length > 0 ? resolve(basePath, files[0]) : null;
// }

// // Initialize database connection
// async function initializeDb() {
//   if (isRemote) {
//     return { isRemote: true };
//   } else {
//     const dbPath = findLocalDbPath();
//     if (!dbPath) {
//       console.error('❌ Could not find local SQLite database file.');
//       process.exit(1);
//     }
//     console.log(`📂 Using database at: ${dbPath}`);
//     return { db: drizzleSQLite(new Database(dbPath), { schema }), isRemote: false };
//   }
// }

// // Function to execute remote SQL commands through Wrangler
// async function executeRemoteSQL(command: string, description?: string) {
//   try {
//     if (description) {
//       console.log(`${colors.blue}Executing: ${description}${colors.reset}`);
//     }

//     const output = execSync(`npx wrangler d1 execute ${DB_NAME} --remote --command="${command.replace(/"/g, '\\"')}"`, {
//       encoding: 'utf-8',
//       maxBuffer: 1024 * 1024 * 10 // 10MB buffer
//     });

//     // Parse the JSON response from the output
//     const jsonMatch = output.match(/\[\s*\{[\s\S]*\}\s*\]/);
//     if (!jsonMatch) {
//       throw new Error(`Invalid response format: ${output}`);
//     }

//     const response = JSON.parse(jsonMatch[0])[0];

//     if (!response.success) {
//       throw new Error(`Command failed: ${output}`);
//     }

//     if (description) {
//       console.log(`${colors.green}✅ Successfully executed: ${description}${colors.reset}`);
//     }

//     // Return appropriate data based on the command type
//     if (response.results && response.results.length > 0) {
//       return response.results[0];
//     } else if (response.meta && response.meta.changes !== undefined) {
//       return { changes: response.meta.changes };
//     } else {
//       return { success: true };
//     }
//   } catch (error) {
//     console.error(`${colors.red}❌ Error executing remote SQL:${colors.reset}`, error);
//     console.error(`${colors.red}Command was:${colors.reset}`, command);
//     throw error;
//   }
// }

// // Function to clear tables
// async function clearTables(dbConnection: any, tables: string[]) {
//   console.log('\n🗑️ Clearing existing data...');

//   const tablesToClear = new Set<string>();
//   tables.forEach(table => {
//     tablesToClear.add(table);
//     if (tableDependentClearMap[table as TableName]) {
//       tableDependentClearMap[table as TableName].forEach(depTable =>
//         tablesToClear.add(depTable)
//       );
//     }
//   });

//   const sortedTablesToDelete = Array.from(tablesToClear).sort((a, b) => {
//     const aIsDep = a.includes('_');
//     const bIsDep = b.includes('_');
//     if (aIsDep && !bIsDep) return -1;
//     if (!aIsDep && bIsDep) return 1;
//     return 0;
//   });

//   for (const table of sortedTablesToDelete) {
//     if (dbConnection.isRemote) {
//       try {
//         // First verify the table exists
//         const tableExists = await executeRemoteSQL(
//           `SELECT name FROM sqlite_master WHERE type='table' AND name='${table}';`,
//           `Checking if table ${table} exists`
//         );

//         if (!tableExists || !tableExists.name) {
//           console.warn(`⚠️ Table ${table} does not exist, skipping...`);
//           continue;
//         }

//         // Then delete from it
//         await executeRemoteSQL(
//           `DELETE FROM ${table};`,
//           `Clearing ${table}`
//         );
//         console.log(`✅ Cleared ${table}`);
//       } catch (error) {
//         console.error(`❌ Failed to clear table ${table}:`, error);
//         throw error;
//       }
//     } else {
//       const schemaTable = (schema as any)[table.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())];
//       if (!schemaTable) {
//         console.warn(`⚠️ No schema found for table: ${table}`);
//         continue;
//       }
//       await dbConnection.db.delete(schemaTable);
//       console.log(`✅ Cleared ${table}`);
//     }
//   }
// }

// // Helper function to convert a value to SQL string
// function toSqlValue(value: any): string {
//   if (value === null || value === undefined) return 'NULL';
//   if (typeof value === 'boolean') return value ? '1' : '0';
//   if (typeof value === 'number') return value.toString();
//   if (value instanceof Date) return Math.floor(value.getTime() / 1000).toString();
//   return `'${value.toString().replace(/'/g, "''")}'`;
// }

// // Helper function to verify remote table exists
// async function verifyRemoteTable(tableName: string): Promise<boolean> {
//   try {
//     const result = await executeRemoteSQL(
//       `SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}';`,
//       `Verifying table ${tableName} exists`
//     );
//     return !!result && !!result.name;
//   } catch (error) {
//     console.error(`❌ Error verifying table ${tableName}:`, error);
//     return false;
//   }
// }

// // Seeding functions
// async function seedTeaCategories(dbConnection: any) {
//   if (!finalTablesToSeed.includes('tea_categories')) return;
//   console.log('\n🍵 Seeding tea categories...');

//   for (const item of mockTeaCategories) {
//     try {
//       if (dbConnection.isRemote) {
//         await executeRemoteSQL(`
//           INSERT INTO tea_categories (name, slug, is_active)
//           VALUES (${toSqlValue(item.name)}, ${toSqlValue(item.slug)}, ${toSqlValue(item.isActive)});
//         `, `Adding tea category: ${item.name}`);
//       } else {
//         await dbConnection.db.insert(schema.teaCategories).values(item)
//           .onConflictDoUpdate({
//             target: schema.teaCategories.slug,
//             set: { name: item.name, isActive: item.isActive }
//           });
//       }
//       console.log(`✅ Added tea category: ${item.name}`);
//     } catch (error) {
//       console.error(`❌ Error processing tea category ${item.name}:`, error);
//       throw error;
//     }
//   }
// }

// // In your seeding functions, process items in smaller batches
// const BATCH_SIZE = 5;

// // Example for categories
// async function seedCategories(dbConnection: any) {
//   if (!finalTablesToSeed.includes('categories')) return;
//   console.log('\n🏷️ Seeding categories...');

//   // Process in smaller batches
//   for (let i = 0; i < mockCategories.length; i += BATCH_SIZE) {
//     const batch = mockCategories.slice(i, i + BATCH_SIZE);
//     console.log(`Processing batch ${i/BATCH_SIZE + 1} of ${Math.ceil(mockCategories.length/BATCH_SIZE)}`);

//     for (const item of batch) {
//       try {
//         if (dbConnection.isRemote) {
//           await executeRemoteSQL(`
//             INSERT INTO categories (name, slug, is_active)
//             VALUES (${toSqlValue(item.name)}, ${toSqlValue(item.slug)}, ${toSqlValue(item.isActive)});
//           `, `Adding category: ${item.name}`);
//         } else {
//           await dbConnection.db.insert(schema.categories).values(item)
//             .onConflictDoUpdate({
//               target: schema.categories.slug,
//               set: { name: item.name, isActive: item.isActive }
//             });
//         }
//         console.log(`✅ Added category: ${item.name}`);
//       } catch (error) {
//         console.error(`❌ Error processing category ${item.name}:`, error);
//         // Continue with next item instead of throwing
//         continue;
//       }
//     }

//     // Add a short delay between batches
//     if (i + BATCH_SIZE < mockCategories.length) {
//       console.log('Waiting 1 second before next batch...');
//       await new Promise(resolve => setTimeout(resolve, 1000));
//     }
//   }
// }

// async function seedBrands(dbConnection: any) {
//   if (!finalTablesToSeed.includes('brands')) return;
//   console.log('\n🏢 Seeding brands...');

//   for (const item of mockBrands) {
//     try {
//       if (dbConnection.isRemote) {
//         await executeRemoteSQL(`
//           INSERT INTO brands (name, slug, is_active)
//           VALUES (${toSqlValue(item.name)}, ${toSqlValue(item.slug)}, ${toSqlValue(item.isActive)});
//         `, `Adding brand: ${item.name}`);
//       } else {
//         await dbConnection.db.insert(schema.brands).values(item)
//           .onConflictDoUpdate({
//             target: schema.brands.slug,
//             set: { name: item.name, isActive: item.isActive }
//           });
//       }
//       console.log(`✅ Added brand: ${item.name}`);
//     } catch (error) {
//       console.error(`❌ Error processing brand ${item.name}:`, error);
//       throw error;
//     }
//   }
// }

// async function seedProducts(dbConnection: any) {
//   if (!finalTablesToSeed.includes('products')) return;
//   console.log('\n🛍️ Seeding products...');

//   // First, ensure tea categories exist without recreating them
//   if (dbConnection.isRemote) {
//     const teaCategoriesExist = await verifyRemoteTable('tea_categories');
//     if (!teaCategoriesExist) {
//       await seedTeaCategories(dbConnection);
//     }
//   }

//   for (const product of mockProducts) {
//     try {
//       const {
//         categorySlug,
//         brandSlug,
//         name,
//         slug,
//         description,
//         images,
//         price,
//         isActive,
//         isFeatured,
//         discount,
//         hasVariations,
//         weight,
//         stock,
//         teaCategories,
//         variations
//       } = product;

//       if (dbConnection.isRemote) {
//         // Insert product
//         await executeRemoteSQL(`
//           INSERT INTO products (
//             category_slug, brand_slug, name, slug, description, images,
//             price, is_active, is_featured, discount, has_variations, weight, stock, unlimited_stock
//           )
//           VALUES (
//             ${toSqlValue(categorySlug)}, ${toSqlValue(brandSlug)},
//             ${toSqlValue(name)}, ${toSqlValue(slug)}, ${toSqlValue(description)},
//             ${toSqlValue(images)}, ${toSqlValue(price)}, ${toSqlValue(isActive)},
//             ${toSqlValue(isFeatured)}, ${toSqlValue(discount)},
//             ${toSqlValue(hasVariations)}, ${toSqlValue(weight)}, ${toSqlValue(stock)},
//             ${toSqlValue(product.unlimitedStock)}
//           );
//         `, `Adding product: ${name}`);

//         // Get the inserted product's ID
//         const result = await executeRemoteSQL(
//           `SELECT id FROM products WHERE slug = ${toSqlValue(slug)};`,
//           `Getting ID for product: ${name}`
//         );
//         const productId = result.id;

//         // Insert tea categories relationships without recreating categories
//         if (teaCategories && teaCategories.length > 0) {
//           const values = teaCategories
//             .map(slug => `(${productId}, ${toSqlValue(slug)})`)
//             .join(', ');

//           await executeRemoteSQL(`
//             INSERT INTO product_tea_categories (product_id, tea_category_slug)
//             VALUES ${values};
//           `, `Adding tea categories for product: ${name}`);
//         }

//         // Add variations
//         if (hasVariations && variations) {
//           const variationsArray = JSON.parse(variations);
//           for (const variation of variationsArray) {
//             const sku = variation.sku || `${slug}-${variation.attributes?.map((attr: { value: string }) => attr.value.toLowerCase()).join('-')}`;

//             const variationResult = await executeRemoteSQL(`
//               INSERT INTO product_variations (product_id, sku, price, stock, sort, createdAt)
//               VALUES (
//                 ${productId},
//                 ${toSqlValue(sku)},
//                 ${toSqlValue(variation.price)},
//                 ${toSqlValue(variation.stock)},
//                 ${toSqlValue(variation.sort || 0)},
//                 ${toSqlValue(new Date())}
//               );
//             `, `Adding variation for product: ${product.name}`);

//             const variationIdResult = await executeRemoteSQL(`
//               SELECT id FROM product_variations
//               WHERE product_id = ${productId} AND sku = ${toSqlValue(sku)}
//               ORDER BY id DESC LIMIT 1;
//             `, `Getting ID for variation`);

//             const variationId = variationIdResult.id;

//             // Now use variationId for attributes
//             if (variation.attributes?.length) {
//               for (const attr of variation.attributes) {
//                 await executeRemoteSQL(`
//                   INSERT INTO variation_attributes (
//                     product_variation_id, attributeId, value, createdAt
//                   ) VALUES (
//                     ${variationId},
//                     ${toSqlValue(attr.attributeId)},
//                     ${toSqlValue(attr.value)},
//                     ${toSqlValue(new Date())}
//                   );
//                 `, `Adding attribute for variation`);
//               }
//             }
//           }
//         }
//       } else {
//         // First check if product exists
//         const existing = await dbConnection.db.select({ id: schema.products.id })
//           .from(schema.products)
//           .where(eq(schema.products.slug, slug));

//         let productId: number;

//         if (existing.length > 0) {
//           productId = existing[0].id;
//           // Update existing product
//           await dbConnection.db.update(schema.products)
//             .set({
//               ...product,
//               createdAt: new Date()
//             })
//             .where(eq(schema.products.slug, slug));
//           console.log(`✅ Updated product: ${name}`);

//           // Delete existing relations
//           await dbConnection.db.delete(schema.productTeaCategories)
//             .where(eq(schema.productTeaCategories.productId, productId));
//           await dbConnection.db.delete(schema.productVariations)
//             .where(eq(schema.productVariations.productId, productId));
//         } else {
//           // Insert new product
//           const result = await dbConnection.db.insert(schema.products)
//             .values({
//               ...product,
//               createdAt: new Date()
//             })
//             .returning({ id: schema.products.id });
//           productId = result[0].id;
//           console.log(`✅ Added product: ${name}`);
//         }

//         // Insert tea categories relationships
//         if (teaCategories && teaCategories.length > 0) {
//           await dbConnection.db.insert(schema.productTeaCategories)
//             .values(
//               teaCategories.map(teaCategorySlug => ({
//                 productId,
//                 teaCategorySlug,
//               }))
//             )
//             .run();
//         }

//         // Add variations
//         if (hasVariations && variations) {
//           const variationsArray = JSON.parse(variations);
//           for (const variation of variationsArray) {
//             const sku = variation.sku || `${slug}-${variation.attributes?.map((attr: { value: string }) => attr.value.toLowerCase()).join('-')}`;

//             const variationResult = await dbConnection.db.insert(schema.productVariations)
//               .values({
//                 productId,
//                 sku,
//                 price: variation.price,
//                 stock: variation.stock,
//                 sort: variation.sort || 0,
//                 createdAt: new Date()
//               })
//               .returning({ id: schema.productVariations.id });

//             // Add variation attributes
//             if (variation.attributes?.length) {
//               for (const attr of variation.attributes) {
//                 await dbConnection.db.insert(schema.variationAttributes)
//                   .values({
//                     productVariationId: variationResult[0].id,
//                     attributeId: attr.attributeId,
//                     value: attr.value,
//                     createdAt: new Date()
//                   });
//               }
//             }
//           }
//         }
//       }
//     } catch (error) {
//       console.error(`❌ Error processing product ${product.name}:`, error);
//       throw error;
//     }
//   }
// }

// async function seedBlogPosts(dbConnection: any) {
//   if (!finalTablesToSeed.includes('blog_posts')) return;
//   console.log('\n📝 Seeding blog posts...');

//   // First, ensure tea categories exist without recreating them
//   if (dbConnection.isRemote) {
//     const teaCategoriesExist = await verifyRemoteTable('tea_categories');
//     if (!teaCategoriesExist) {
//       await seedTeaCategories(dbConnection);
//     }
//   }

//   for (const post of mockBlogPosts) {
//     try {
//       if (dbConnection.isRemote) {
//         // Insert blog post
//         const result = await executeRemoteSQL(`
//           INSERT INTO blog_posts (title, slug, body, images, product_slug, published_at)
//           VALUES (
//             ${post.title ? toSqlValue(post.title) : 'NULL'},
//             ${toSqlValue(post.slug)},
//             ${toSqlValue(post.body)},
//             ${toSqlValue(post.images)},
//             ${toSqlValue(post.productSlug)},
//             ${toSqlValue(new Date(post.publishedAt * 1000))}
//           ) RETURNING id;
//         `, `Adding blog post: ${post.title || post.slug}`);

//         // Add tea categories
//         if (post.teaCategories?.length) {
//           for (const slug of post.teaCategories) {
//             await executeRemoteSQL(`
//               INSERT INTO blog_tea_categories (blog_post_id, tea_category_slug)
//               VALUES (${result.id}, ${toSqlValue(slug)});
//             `, `Adding tea category ${slug} to blog post: ${post.title || post.slug}`);
//           }
//         }
//       } else {
//         // Check if post exists
//         const existing = await dbConnection.db.select({ id: schema.blogPosts.id })
//           .from(schema.blogPosts)
//           .where(eq(schema.blogPosts.slug, post.slug));

//         let postId: number;

//         if (existing.length > 0) {
//           postId = existing[0].id;
//           // Update existing post
//           await dbConnection.db.update(schema.blogPosts)
//             .set({
//               title: post.title || null,
//               body: post.body,
//               images: post.images || null,
//               productSlug: post.productSlug || null,
//               publishedAt: new Date(post.publishedAt * 1000)
//             })
//             .where(eq(schema.blogPosts.slug, post.slug));
//           console.log(`✅ Updated blog post: ${post.title || post.slug}`);

//           // Delete existing categories
//           await dbConnection.db.delete(schema.blogTeaCategories)
//             .where(eq(schema.blogTeaCategories.blogPostId, postId));
//         } else {
//           // Insert new post
//           const result = await dbConnection.db.insert(schema.blogPosts)
//             .values({
//               ...post,
//               title: post.title || null,
//               publishedAt: new Date(post.publishedAt * 1000)
//             })
//             .returning({ id: schema.blogPosts.id });
//           postId = result[0].id;
//           console.log(`✅ Added blog post: ${post.title || post.slug}`);
//         }

//         // Add tea categories
//         if (post.teaCategories?.length) {
//           for (const slug of post.teaCategories) {
//             await dbConnection.db.insert(schema.blogTeaCategories)
//               .values({ blogPostId: postId, teaCategorySlug: slug });
//           }
//         }
//       }
//     } catch (error) {
//       console.error(`❌ Error processing blog post ${post.title || post.slug}:`, error);
//       throw error;
//     }
//   }
// }

// // Main seeding function
// async function seedDatabase() {
//   console.log(`🌱 Seeding ${isRemote ? 'remote' : 'local'} database...`);
//   console.log(`📊 Tables to seed: ${finalTablesToSeed.join(', ')}`);

//   try {
//     const dbConnection = await initializeDb();

//     await clearTables(dbConnection, finalTablesToSeed);
//     await seedTeaCategories(dbConnection);
//     await seedCategories(dbConnection);
//     await seedBrands(dbConnection);
//     await seedProducts(dbConnection);
//     await seedBlogPosts(dbConnection);

//     console.log(`\n🎉 ${isRemote ? 'Remote' : 'Local'} database seeded successfully!`);
//   } catch (error) {
//     console.error(`❌ Error seeding ${isRemote ? 'remote' : 'local'} database:`, error);
//     process.exit(1);
//   }
// }

// // Run the seeding process
// seedDatabase();
