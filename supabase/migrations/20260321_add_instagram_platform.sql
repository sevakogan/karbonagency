-- Add 'instagram' to daily_metrics platform check constraint
ALTER TABLE daily_metrics DROP CONSTRAINT IF EXISTS daily_metrics_platform_check;
ALTER TABLE daily_metrics ADD CONSTRAINT daily_metrics_platform_check
  CHECK (platform IN ('meta', 'google', 'tiktok', 'instagram'));

-- Add Instagram to platform_catalog
INSERT INTO platform_catalog (slug, display_name, category, credential_fields, can_run_ads, sync_enabled, is_active, sort_order)
VALUES (
  'instagram',
  'Instagram',
  'social',
  '[
    {
      "key": "ig_user_id",
      "label": "Instagram Business Account ID",
      "type": "text",
      "required": false,
      "placeholder": "17841400000000000",
      "help": "Auto-resolved from your linked Facebook Page if not provided",
      "walkthrough": {
        "title": "Find your Instagram Business Account ID",
        "steps": [
          "Go to Meta Business Suite → Settings → Accounts → Instagram accounts",
          "Your IG Business Account ID is shown under the account name",
          "Or leave blank — we auto-detect it from your Facebook Page"
        ],
        "direct_link": "https://business.facebook.com/settings/instagram-accounts"
      }
    },
    {
      "key": "page_id",
      "label": "Facebook Page ID",
      "type": "text",
      "required": false,
      "placeholder": "996328786901360",
      "help": "The Facebook Page linked to your Instagram Business account"
    },
    {
      "key": "access_token",
      "label": "Meta Access Token",
      "type": "secret",
      "required": true,
      "placeholder": "EAATy20Uk3fw...",
      "help": "Same token used for Meta Ads — must include instagram_basic and instagram_manage_insights permissions",
      "walkthrough": {
        "title": "Get your Meta Access Token with Instagram permissions",
        "steps": [
          "Go to Meta Business Suite → Settings → Business Settings → System Users",
          "Select your system user and click Generate New Token",
          "Select permissions: instagram_basic, instagram_manage_insights, pages_show_list, pages_read_engagement",
          "Copy the generated token"
        ],
        "direct_link": "https://business.facebook.com/settings/system-users"
      }
    }
  ]'::jsonb,
  false,
  true,
  true,
  2
)
ON CONFLICT (slug) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  credential_fields = EXCLUDED.credential_fields,
  sync_enabled = EXCLUDED.sync_enabled,
  is_active = EXCLUDED.is_active;

-- Add instagram_business_account_id to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS instagram_business_account_id TEXT;
