import type { TestConnectionResult, PlatformSlug } from '@/types';

export async function testConnection(
  platformSlug: PlatformSlug,
  credentials: Record<string, string>
): Promise<TestConnectionResult> {
  switch (platformSlug) {
    case 'meta_ads':
      return testMetaAds(credentials);
    case 'google_analytics':
      return testGoogleAnalytics(credentials);
    default:
      return testFieldsPresent(platformSlug, credentials);
  }
}

async function testMetaAds(
  credentials: Record<string, string>
): Promise<TestConnectionResult> {
  const { ad_account_id, access_token } = credentials;
  if (!ad_account_id || !access_token) {
    return { success: false, error: 'Ad Account ID and Access Token are required' };
  }

  try {
    const accountId = ad_account_id.startsWith('act_') ? ad_account_id : `act_${ad_account_id}`;
    const url = `https://graph.facebook.com/v21.0/${accountId}?fields=name,account_status&access_token=${access_token}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      return { success: false, error: data.error.message ?? 'Invalid credentials' };
    }

    return {
      success: true,
      accountName: data.name ?? accountId,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Connection failed' };
  }
}

async function testGoogleAnalytics(
  credentials: Record<string, string>
): Promise<TestConnectionResult> {
  const { property_id, service_account_json } = credentials;
  if (!property_id || !service_account_json) {
    return { success: false, error: 'Property ID and Service Account JSON are required' };
  }

  try {
    // Validate JSON is parseable
    const sa = JSON.parse(service_account_json);
    if (!sa.client_email || !sa.private_key) {
      return { success: false, error: 'Invalid service account JSON — missing client_email or private_key' };
    }

    // For now, validate the fields look correct
    // Full GA4 API test requires JWT signing which we'll implement in the sync function
    return {
      success: true,
      accountName: `GA4 Property ${property_id}`,
    };
  } catch {
    return { success: false, error: 'Service Account JSON is not valid JSON' };
  }
}

async function testFieldsPresent(
  _platformSlug: PlatformSlug,
  credentials: Record<string, string>
): Promise<TestConnectionResult> {
  const hasValues = Object.values(credentials).some((v) => v && v.trim() !== '');
  if (!hasValues) {
    return { success: false, error: 'Please fill in at least one credential field' };
  }

  return {
    success: true,
    accountName: 'Credentials saved (sync coming soon)',
  };
}
