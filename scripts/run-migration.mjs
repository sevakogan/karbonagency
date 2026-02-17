/**
 * Run the campaign_id migration on daily_metrics.
 *
 * Usage: DATABASE_URL="postgresql://..." node scripts/run-migration.mjs
 *
 * Get your DATABASE_URL from:
 *   Supabase Dashboard > Project Settings > Database > Connection string > URI
 */

import pg from "pg";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("ERROR: DATABASE_URL environment variable is required.");
  console.error("");
  console.error("Get it from: Supabase Dashboard > Project Settings > Database > Connection string (URI)");
  console.error("");
  console.error('Usage: DATABASE_URL="postgresql://postgres:[password]@aws-0-us-west-1.pooler.supabase.com:6543/postgres" node scripts/run-migration.mjs');
  process.exit(1);
}

const client = new pg.Client({ connectionString: DATABASE_URL });

try {
  await client.connect();
  console.log("Connected to database");

  // Step 1: Add campaign_id column
  console.log("1. Adding campaign_id column...");
  await client.query(`
    ALTER TABLE daily_metrics
    ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE
  `);
  console.log("   Done");

  // Step 2: Drop old unique constraint
  console.log("2. Dropping old unique constraint...");
  await client.query(`
    ALTER TABLE daily_metrics
    DROP CONSTRAINT IF EXISTS daily_metrics_client_id_date_platform_key
  `);
  console.log("   Done");

  // Step 3: Create new unique index
  console.log("3. Creating new unique index with campaign_id...");
  await client.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS daily_metrics_client_campaign_date_platform_key
    ON daily_metrics (client_id, COALESCE(campaign_id, '00000000-0000-0000-0000-000000000000'), date, platform)
  `);
  console.log("   Done");

  // Step 4: Add campaign_id index
  console.log("4. Adding campaign_id index...");
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_daily_metrics_campaign_id ON daily_metrics (campaign_id)
  `);
  console.log("   Done");

  // Step 5: Delete existing rows for re-sync
  console.log("5. Deleting existing rows for re-sync...");
  const result = await client.query("DELETE FROM daily_metrics");
  console.log(`   Deleted ${result.rowCount} rows`);

  console.log("");
  console.log("Migration complete! Now re-sync your Meta data from the admin dashboard.");
} catch (err) {
  console.error("Migration failed:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
