/**
 * One-time script: Migrate existing Meta credentials from .env.local
 * into the company_integrations table for Shift Arcade Miami.
 *
 * Run with: npx tsx scripts/migrate-meta-credentials.ts
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import { createCipheriv, randomBytes } from 'crypto';

// Load .env.local manually
const envPath = resolve(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx);
  const val = trimmed.slice(eqIdx + 1);
  if (!process.env[key]) process.env[key] = val;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ENCRYPTION_KEY = Buffer.from(process.env.CREDENTIAL_ENCRYPTION_KEY!, 'hex');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function encrypt(plaintext: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

async function main() {
  // 1. Find Shift Arcade company
  const { data: companies, error: companyError } = await supabase
    .from('clients')
    .select('id, name, slug, meta_ad_account_id, meta_page_id, meta_pixel_id')
    .eq('is_active', true)
    .order('name');

  if (companyError) {
    console.error('Failed to fetch companies:', companyError.message);
    process.exit(1);
  }

  console.log('Found companies:');
  for (const c of companies) {
    console.log(`  - ${c.name} (${c.id}) | meta_ad_account: ${c.meta_ad_account_id ?? 'none'}`);
  }

  // Find Shift Arcade (look for various name patterns)
  const shiftArcade = companies.find(
    (c) => c.name.toLowerCase().includes('shift') || c.slug?.includes('shift')
  );

  if (!shiftArcade) {
    console.error('Could not find Shift Arcade company. Available:', companies.map((c) => c.name));
    process.exit(1);
  }

  console.log(`\nMigrating Meta credentials for: ${shiftArcade.name} (${shiftArcade.id})`);

  // 2. Encrypt the credentials from .env
  const metaCredentials = {
    ad_account_id: encrypt(process.env.META_AD_ACCOUNT_ID ?? ''),
    page_id: encrypt(process.env.META_PAGE_ID ?? ''),
    pixel_id: encrypt(''), // not set in env
    access_token: encrypt(process.env.META_ACCESS_TOKEN ?? ''),
  };

  // 3. Upsert into company_integrations
  const { error: upsertError } = await supabase
    .from('company_integrations')
    .upsert(
      {
        company_id: shiftArcade.id,
        platform_slug: 'meta_ads',
        credentials: metaCredentials,
        is_enabled: true,
        status: 'connected',
        status_detail: 'Migrated from env vars',
      },
      { onConflict: 'company_id,platform_slug' }
    );

  if (upsertError) {
    console.error('Failed to upsert integration:', upsertError.message);
    process.exit(1);
  }

  console.log('Meta Ads integration created and marked as connected.');

  // 4. Verify existing daily_metrics data
  const { count } = await supabase
    .from('daily_metrics')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', shiftArcade.id)
    .eq('platform', 'meta');

  console.log(`Existing daily_metrics rows for this company: ${count ?? 0}`);

  // 5. Check all companies and create placeholder integrations
  for (const company of companies) {
    if (company.id === shiftArcade.id) continue;

    // Check if they have meta_ad_account_id set on the clients table
    if (company.meta_ad_account_id) {
      console.log(`\n${company.name} has meta_ad_account_id: ${company.meta_ad_account_id}`);

      const creds = {
        ad_account_id: encrypt(company.meta_ad_account_id),
        page_id: encrypt(company.meta_page_id ?? ''),
        pixel_id: encrypt(company.meta_pixel_id ?? ''),
        access_token: encrypt(process.env.META_ACCESS_TOKEN ?? ''), // shared token
      };

      const { error } = await supabase
        .from('company_integrations')
        .upsert(
          {
            company_id: company.id,
            platform_slug: 'meta_ads',
            credentials: creds,
            is_enabled: true,
            status: 'connected',
            status_detail: 'Migrated from client table',
          },
          { onConflict: 'company_id,platform_slug' }
        );

      if (error) {
        console.error(`  Failed for ${company.name}:`, error.message);
      } else {
        console.log(`  Meta Ads integration created for ${company.name}`);
      }
    }
  }

  console.log('\nDone! All Meta credentials migrated.');
}

main().catch(console.error);
