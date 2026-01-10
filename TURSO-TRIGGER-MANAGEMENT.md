# Turso Database Trigger Management Guide

## Overview

This guide explains how to properly manage SQLite triggers in Turso databases, specifically for Full-Text Search (FTS) synchronization.

## The Problem We Solved

### What Happened
- Products table has FTS (Full-Text Search) triggers that automatically update the `products_fts` virtual table
- The triggers had an outdated reference: `T.brand_name` (which doesn't exist)
- This caused all product UPDATE operations to fail with: `SQLite error: no such column: T.brand_name`

### Why It Happened
- The schema changed (removed `brand_name` column from products table)
- The triggers weren't updated to match the new schema
- Triggers reference `brands` and `collections` tables via foreign key relationships

## The Proper Solution: Turso CLI

### Why Use Turso CLI?
1. **Direct database access** - No need for application code
2. **Production-safe** - Execute SQL directly on the correct database
3. **Simple** - One command per SQL statement
4. **Verifiable** - Immediately see results

### How to Fix Triggers

#### Step 1: Login to Turso
```bash
turso auth login
```

#### Step 2: List Your Databases
```bash
turso db list
```

#### Step 3: Run the Fix Script
```bash
./migration/scripts/FIX-FTS-TRIGGERS-CLI.sh <your-database-name>
```

**Example:**
```bash
./migration/scripts/FIX-FTS-TRIGGERS-CLI.sh bfloor-production
```

#### Alternative: Manual Commands

If you prefer to run commands manually:

```bash
# Drop old triggers
turso db shell bfloor-production "DROP TRIGGER IF EXISTS products_fts_update;"
turso db shell bfloor-production "DROP TRIGGER IF EXISTS products_fts_insert;"
turso db shell bfloor-production "DROP TRIGGER IF EXISTS products_fts_delete;"

# Create new INSERT trigger
turso db shell bfloor-production "
CREATE TRIGGER products_fts_insert AFTER INSERT ON products BEGIN
  INSERT INTO products_fts(rowid, name, brand_name, collection_name)
  VALUES (
    new.id,
    new.name,
    COALESCE((SELECT name FROM brands WHERE slug = new.brand_slug LIMIT 1), ''),
    COALESCE((SELECT name FROM collections WHERE slug = new.collection_slug LIMIT 1), '')
  );
END;
"

# Create new DELETE trigger
turso db shell bfloor-production "
CREATE TRIGGER products_fts_delete AFTER DELETE ON products BEGIN
  DELETE FROM products_fts WHERE rowid = old.id;
END;
"

# Create new UPDATE trigger
turso db shell bfloor-production "
CREATE TRIGGER products_fts_update AFTER UPDATE ON products BEGIN
  DELETE FROM products_fts WHERE rowid = old.id;
  INSERT INTO products_fts(rowid, name, brand_name, collection_name)
  VALUES (
    new.id,
    new.name,
    COALESCE((SELECT name FROM brands WHERE slug = new.brand_slug LIMIT 1), ''),
    COALESCE((SELECT name FROM collections WHERE slug = new.collection_slug LIMIT 1), '')
  );
END;
"
```

#### Step 4: Verify
```bash
turso db shell bfloor-production "SELECT name FROM sqlite_master WHERE type = 'trigger' AND name LIKE 'products_fts%';"
```

You should see:
```
products_fts_insert
products_fts_delete
products_fts_update
```

## Understanding FTS Triggers

### What are FTS Triggers?

FTS (Full-Text Search) triggers are SQLite triggers that automatically keep a virtual FTS table synchronized with your main data table.

### Why Do We Need Them?

1. **FTS tables don't auto-update** - When you INSERT/UPDATE/DELETE in `products`, the `products_fts` table doesn't automatically update
2. **Manual sync is error-prone** - Forgetting to update FTS leads to stale search results
3. **Triggers automate it** - Every change to `products` automatically updates `products_fts`

### Our FTS Setup

#### Main Table: `products`
```sql
CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  brand_slug TEXT REFERENCES brands(slug),
  collection_slug TEXT REFERENCES collections(slug),
  -- ... other columns
);
```

#### FTS Virtual Table: `products_fts`
```sql
CREATE VIRTUAL TABLE products_fts USING fts5(
  name,           -- Product name (searchable)
  brand_name,     -- Brand name (searchable)
  collection_name -- Collection name (searchable)
);
```

#### The Triggers

**1. INSERT Trigger** - When a new product is added:
```sql
CREATE TRIGGER products_fts_insert AFTER INSERT ON products BEGIN
  INSERT INTO products_fts(rowid, name, brand_name, collection_name)
  VALUES (
    new.id,
    new.name,
    COALESCE((SELECT name FROM brands WHERE slug = new.brand_slug LIMIT 1), ''),
    COALESCE((SELECT name FROM collections WHERE slug = new.collection_slug LIMIT 1), '')
  );
END;
```

**Key points:**
- `new.id` → `rowid` in FTS table (links FTS row to products row)
- `new.name` → directly from products table
- `brand_name` → **looked up** from `brands` table using `brand_slug`
- `collection_name` → **looked up** from `collections` table using `collection_slug`
- `COALESCE(..., '')` → returns empty string if brand/collection doesn't exist

**2. DELETE Trigger** - When a product is deleted:
```sql
CREATE TRIGGER products_fts_delete AFTER DELETE ON products BEGIN
  DELETE FROM products_fts WHERE rowid = old.id;
END;
```

**Key points:**
- Simple: just delete the corresponding FTS row
- `old.id` refers to the deleted product's ID

**3. UPDATE Trigger** - When a product is updated:
```sql
CREATE TRIGGER products_fts_update AFTER UPDATE ON products BEGIN
  DELETE FROM products_fts WHERE rowid = old.id;
  INSERT INTO products_fts(rowid, name, brand_name, collection_name)
  VALUES (
    new.id,
    new.name,
    COALESCE((SELECT name FROM brands WHERE slug = new.brand_slug LIMIT 1), ''),
    COALESCE((SELECT name FROM collections WHERE slug = new.collection_slug LIMIT 1), '')
  );
END;
```

**Key points:**
- Two-step process: DELETE old, INSERT new
- This is simpler than trying to UPDATE the FTS table
- Ensures FTS data is always fresh

### Common Trigger Mistakes

❌ **Wrong:** Referencing columns that don't exist
```sql
-- This fails because products table doesn't have brand_name column
VALUES (new.id, new.name, new.brand_name, new.collection_name)
```

✅ **Correct:** Looking up related data via foreign keys
```sql
-- This works because we JOIN to brands table via brand_slug
VALUES (
  new.id,
  new.name,
  (SELECT name FROM brands WHERE slug = new.brand_slug LIMIT 1),
  (SELECT name FROM collections WHERE slug = new.collection_slug LIMIT 1)
)
```

❌ **Wrong:** Using table aliases in triggers
```sql
-- SQLite triggers don't support table aliases like T.brand_name
SELECT T.name FROM brands T WHERE T.slug = new.brand_slug
```

✅ **Correct:** Direct table references
```sql
-- Use the table name directly
SELECT name FROM brands WHERE slug = new.brand_slug
```

## Best Practices

### 1. Version Control Your Triggers
Keep trigger definitions in your codebase (e.g., `schema.sql`) so you can track changes.

### 2. Test Triggers Locally First
```bash
# Test on local database first
turso db shell local-db "DROP TRIGGER IF EXISTS products_fts_update;"
turso db shell local-db "CREATE TRIGGER ..."
```

### 3. Use Turso CLI for Schema Changes
Don't try to manage triggers through application code - use the CLI directly.

### 4. Document Your FTS Setup
Keep notes on:
- Which tables have FTS
- What columns are indexed
- How triggers are structured

### 5. Verify After Changes
Always check that triggers were created successfully:
```bash
turso db shell <db-name> "SELECT name, sql FROM sqlite_master WHERE type = 'trigger';"
```

## Troubleshooting

### Problem: "no such column: T.brand_name"
**Cause:** Trigger is using a column that doesn't exist or using invalid syntax

**Solution:** Drop and recreate the trigger with correct column references

### Problem: "no such table: products"
**Cause:** Wrong database or connection issue

**Solution:** Verify you're connected to the right database with `turso db list`

### Problem: FTS search returns stale results
**Cause:** Triggers aren't firing or were deleted

**Solution:** Verify triggers exist and recreate them if needed

## Future Improvements

### Option 1: Drizzle ORM Migrations
Consider using Drizzle's migration system to manage triggers:

```typescript
// drizzle/migrations/0001_add_fts_triggers.sql
DROP TRIGGER IF EXISTS products_fts_update;
CREATE TRIGGER products_fts_update AFTER UPDATE ON products BEGIN
  -- trigger definition
END;
```

Then run: `drizzle-kit push:sqlite`

### Option 2: Automated Trigger Management
Create a migration script that automatically updates triggers when schema changes.

### Option 3: FTS Rebuild Command
Add an admin endpoint to rebuild the entire FTS index:
```sql
DELETE FROM products_fts;
INSERT INTO products_fts(rowid, name, brand_name, collection_name)
SELECT 
  p.id,
  p.name,
  COALESCE(b.name, ''),
  COALESCE(c.name, '')
FROM products p
LEFT JOIN brands b ON b.slug = p.brand_slug
LEFT JOIN collections c ON c.slug = p.collection_slug;
```

## Summary

- ✅ Use **Turso CLI** for trigger management
- ✅ Triggers keep FTS tables synchronized automatically
- ✅ Always test locally before production
- ✅ Verify triggers after changes
- ✅ Document your FTS setup

**The proper way to fix triggers in Turso:**
```bash
turso db shell <database-name> "SQL COMMAND HERE"
```

No need for complex application code or admin pages! 🚀
