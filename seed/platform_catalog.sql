-- Seed all 12 marketing platforms into platform_catalog
-- Idempotent: uses INSERT ... ON CONFLICT DO UPDATE

-- 1. Meta Ads (Facebook + Instagram)
INSERT INTO platform_catalog (slug, display_name, category, credential_fields, can_run_ads, sync_enabled, is_active, sort_order)
VALUES (
  'meta_ads',
  'Meta Ads (Facebook + Instagram)',
  'ads',
  $json$[{"key":"ad_account_id","label":"Ad Account ID","type":"text","required":true,"placeholder":"act_123456789","help":"Your Meta Ad Account identifier. Starts with 'act_' followed by numbers.","walkthrough":{"title":"How to find your Ad Account ID","steps":["Go to Meta Business Suite → business.facebook.com","Click the gear icon (Settings) in the bottom-left","Click 'Ad Accounts' under 'Accounts' in the left sidebar","Your Ad Account ID is shown next to each ad account (format: act_XXXXXXXXX)","Copy the full ID including the 'act_' prefix"],"direct_link":"https://business.facebook.com/settings/ad-accounts"}},{"key":"page_id","label":"Facebook Page ID","type":"text","required":true,"placeholder":"123456789012345","help":"The numeric ID of your Facebook Business Page.","walkthrough":{"title":"How to find your Page ID","steps":["Go to your Facebook Page","Click 'About' in the left menu","Scroll to the bottom — your Page ID is listed under 'Page transparency'","Alternatively: Go to Meta Business Suite → Settings → Pages → select your page → the ID is in the URL"],"direct_link":"https://business.facebook.com/settings/pages"}},{"key":"pixel_id","label":"Meta Pixel ID","type":"text","required":false,"placeholder":"123456789012345","help":"Optional. Used for conversion tracking. A 15-16 digit number.","walkthrough":{"title":"How to find your Pixel ID","steps":["Go to Meta Events Manager → facebook.com/events_manager","Click 'Data Sources' in the left sidebar","Select your Pixel","The Pixel ID is shown at the top of the page"],"direct_link":"https://business.facebook.com/events_manager/overview"}},{"key":"access_token","label":"Access Token","type":"secret","required":true,"placeholder":"EAAxxxxxxxxx...","help":"A long-lived access token with ads_read permission. Starts with 'EAA'.","walkthrough":{"title":"How to generate your Access Token","steps":["Go to Meta for Developers → developers.facebook.com","Select your app (or create one: My Apps → Create App → Business)","Go to Tools → Graph API Explorer","Select your app from the dropdown","Click 'Generate Access Token'","Required permissions: ads_read, pages_read_engagement, read_insights","Click 'Generate' and copy the token","IMPORTANT: Exchange for a long-lived token (60-day) in the Access Token Tool"],"direct_link":"https://developers.facebook.com/tools/explorer/"}}]$json$,
  true,
  true,
  true,
  1
)
ON CONFLICT (slug) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  category = EXCLUDED.category,
  credential_fields = EXCLUDED.credential_fields,
  can_run_ads = EXCLUDED.can_run_ads,
  sync_enabled = EXCLUDED.sync_enabled,
  sort_order = EXCLUDED.sort_order;

-- 2. Google Analytics 4
INSERT INTO platform_catalog (slug, display_name, category, credential_fields, can_run_ads, sync_enabled, is_active, sort_order)
VALUES (
  'google_analytics',
  'Google Analytics 4',
  'analytics',
  $json$[{"key":"property_id","label":"GA4 Property ID","type":"text","required":true,"placeholder":"123456789","help":"A 9-digit number identifying your GA4 property.","walkthrough":{"title":"How to find your GA4 Property ID","steps":["Go to Google Analytics → analytics.google.com","Click the gear icon (Admin) in the bottom-left","Under the 'Property' column, click 'Property Settings'","Your Property ID is displayed at the top (a 9-digit number)","Make sure this is a GA4 property, not a Universal Analytics property"],"direct_link":"https://analytics.google.com/analytics/web/#/a0p0/admin/property/settings"}},{"key":"service_account_json","label":"Service Account Key (JSON)","type":"secret","required":true,"placeholder":"Paste your full JSON key file contents here","help":"A JSON key file from a Google Cloud service account with GA4 read access.","walkthrough":{"title":"How to create a Service Account and get the JSON key","steps":["Go to Google Cloud Console → console.cloud.google.com","Select your project (or create one)","Enable the 'Google Analytics Data API' — search in the API Library","Go to IAM & Admin → Service Accounts","Click '+ Create Service Account'","Name it something like 'karbon-ga4-reader'","Skip the optional permissions step (click 'Continue' then 'Done')","Click on the new service account → 'Keys' tab → 'Add Key' → 'Create new key' → JSON","A .json file will download — open it and paste the ENTIRE contents into this field","IMPORTANT: Go back to Google Analytics → Admin → Property → Property Access Management","Add the service account email (from the JSON, field 'client_email') as a Viewer"],"direct_link":"https://console.cloud.google.com/iam-admin/serviceaccounts"}}]$json$,
  false,
  true,
  true,
  2
)
ON CONFLICT (slug) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  category = EXCLUDED.category,
  credential_fields = EXCLUDED.credential_fields,
  can_run_ads = EXCLUDED.can_run_ads,
  sync_enabled = EXCLUDED.sync_enabled,
  sort_order = EXCLUDED.sort_order;

-- 3. Google Ads
INSERT INTO platform_catalog (slug, display_name, category, credential_fields, can_run_ads, sync_enabled, is_active, sort_order)
VALUES (
  'google_ads',
  'Google Ads',
  'ads',
  $json$[{"key":"customer_id","label":"Customer ID","type":"text","required":true,"placeholder":"123-456-7890","help":"Your Google Ads customer ID. Format: XXX-XXX-XXXX.","walkthrough":{"title":"How to find your Google Ads Customer ID","steps":["Sign in to Google Ads → ads.google.com","Your Customer ID is in the top-right corner next to your account name","Format: XXX-XXX-XXXX (10 digits with dashes)"],"direct_link":"https://ads.google.com"}},{"key":"developer_token","label":"Developer Token","type":"secret","required":true,"placeholder":"xxxxxxxxxxxxxxxx","help":"Required for API access. Found in the Google Ads API Center.","walkthrough":{"title":"How to get your Developer Token","steps":["Sign in to your Google Ads Manager account","Go to Tools & Settings → Setup → API Center","Your developer token is displayed on this page","If you don't have one, you'll need to apply for API access"],"direct_link":"https://ads.google.com/aw/apicenter"}},{"key":"oauth_client_id","label":"OAuth Client ID","type":"text","required":true,"placeholder":"xxxxx.apps.googleusercontent.com","help":"OAuth 2.0 Client ID from Google Cloud Console.","walkthrough":{"title":"How to set up OAuth credentials","steps":["Go to Google Cloud Console → console.cloud.google.com","Navigate to APIs & Services → Credentials","Click '+ Create Credentials' → 'OAuth client ID'","Application type: 'Web application'","Copy the Client ID"],"direct_link":"https://console.cloud.google.com/apis/credentials"}},{"key":"oauth_client_secret","label":"OAuth Client Secret","type":"secret","required":true,"placeholder":"GOCSPX-xxxxxxxx","help":"OAuth 2.0 Client Secret, paired with the Client ID above.","walkthrough":{"title":"Where to find your Client Secret","steps":["In Google Cloud Console → APIs & Services → Credentials","Click on your OAuth 2.0 Client ID","The Client Secret is shown on the right side"],"direct_link":"https://console.cloud.google.com/apis/credentials"}},{"key":"refresh_token","label":"Refresh Token","type":"secret","required":true,"placeholder":"1//0xxxxxxxxxxxxxxx","help":"OAuth refresh token for offline access.","walkthrough":{"title":"How to generate a Refresh Token","steps":["Go to Google OAuth Playground → developers.google.com/oauthplayground","Click the gear icon → check 'Use your own OAuth credentials'","Enter your Client ID and Client Secret","In Step 1, find 'Google Ads API' and select the scope","Click 'Authorize APIs' and sign in with the Google account that owns the Ads account","In Step 2, click 'Exchange authorization code for tokens'","Copy the 'Refresh token' value"],"direct_link":"https://developers.google.com/oauthplayground"}}]$json$,
  true,
  false,
  true,
  3
)
ON CONFLICT (slug) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  category = EXCLUDED.category,
  credential_fields = EXCLUDED.credential_fields,
  can_run_ads = EXCLUDED.can_run_ads,
  sync_enabled = EXCLUDED.sync_enabled,
  sort_order = EXCLUDED.sort_order;

-- 4. Google Business Profile
INSERT INTO platform_catalog (slug, display_name, category, credential_fields, can_run_ads, sync_enabled, is_active, sort_order)
VALUES (
  'google_business',
  'Google Business Profile',
  'reviews',
  $json$[{"key":"account_id","label":"Business Profile Account ID","type":"text","required":true,"placeholder":"123456789","help":"Your Google Business Profile account number.","walkthrough":{"title":"How to find your Account ID","steps":["Go to Google Business Profile Manager → business.google.com","The account ID is in the URL after you select your business","Or go to Settings → Account settings"],"direct_link":"https://business.google.com"}},{"key":"location_id","label":"Location ID","type":"text","required":true,"placeholder":"locations/123456789","help":"The specific location identifier if you have multiple locations.","walkthrough":{"title":"How to find your Location ID","steps":["In Google Business Profile Manager, select your business","The location ID appears in the URL","Format: locations/XXXXXXXXX"],"direct_link":"https://business.google.com"}},{"key":"service_account_json","label":"Service Account Key (JSON)","type":"secret","required":true,"placeholder":"Paste your full JSON key file contents here","help":"Same type of service account as GA4. Needs Business Profile API enabled.","walkthrough":{"title":"How to set up the Service Account","steps":["Go to Google Cloud Console → console.cloud.google.com","Enable the 'My Business Business Information API' and 'My Business Account Management API'","Create or reuse a service account (same steps as GA4)","Download the JSON key","Invite the service account email as a manager on your Business Profile"],"direct_link":"https://console.cloud.google.com/apis/library"}}]$json$,
  false,
  false,
  true,
  4
)
ON CONFLICT (slug) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  category = EXCLUDED.category,
  credential_fields = EXCLUDED.credential_fields,
  can_run_ads = EXCLUDED.can_run_ads,
  sync_enabled = EXCLUDED.sync_enabled,
  sort_order = EXCLUDED.sort_order;

-- 5. Google Search Console
INSERT INTO platform_catalog (slug, display_name, category, credential_fields, can_run_ads, sync_enabled, is_active, sort_order)
VALUES (
  'google_search_console',
  'Google Search Console',
  'seo',
  $json$[{"key":"site_url","label":"Site URL","type":"text","required":true,"placeholder":"https://example.com or sc-domain:example.com","help":"Your verified property URL exactly as it appears in Search Console.","walkthrough":{"title":"How to find your Site URL","steps":["Go to Google Search Console → search.google.com/search-console","Your verified properties are listed in the dropdown at the top-left","Copy the URL exactly — include https:// or use the sc-domain: prefix for domain properties"],"direct_link":"https://search.google.com/search-console"}},{"key":"service_account_json","label":"Service Account Key (JSON)","type":"secret","required":true,"placeholder":"Paste your full JSON key file contents here","help":"Service account with Search Console API access.","walkthrough":{"title":"How to set up the Service Account","steps":["Go to Google Cloud Console → Enable 'Google Search Console API'","Create or reuse a service account and download the JSON key","Go to Search Console → Settings → Users and permissions","Add the service account email (client_email from JSON) as a 'Full' user"],"direct_link":"https://console.cloud.google.com/apis/library"}}]$json$,
  false,
  false,
  true,
  5
)
ON CONFLICT (slug) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  category = EXCLUDED.category,
  credential_fields = EXCLUDED.credential_fields,
  can_run_ads = EXCLUDED.can_run_ads,
  sync_enabled = EXCLUDED.sync_enabled,
  sort_order = EXCLUDED.sort_order;

-- 6. TikTok Ads
INSERT INTO platform_catalog (slug, display_name, category, credential_fields, can_run_ads, sync_enabled, is_active, sort_order)
VALUES (
  'tiktok_ads',
  'TikTok Ads',
  'ads',
  $json$[{"key":"advertiser_id","label":"Advertiser ID","type":"text","required":true,"placeholder":"1234567890123","help":"Your TikTok Ads advertiser ID (13-digit number).","walkthrough":{"title":"How to find your Advertiser ID","steps":["Log in to TikTok Ads Manager → ads.tiktok.com","Click your profile icon in the top-right","Your Advertiser ID is shown under your account name","Or go to Account Settings → the ID is at the top"],"direct_link":"https://ads.tiktok.com/i18n/dashboard"}},{"key":"access_token","label":"Access Token","type":"secret","required":true,"placeholder":"xxxxxxxxxxxxxxxxxxxxxxxx","help":"Long-lived access token from TikTok Marketing API.","walkthrough":{"title":"How to generate an Access Token","steps":["Go to TikTok for Developers → developers.tiktok.com","Create or select your app under 'My Apps'","Go to the Marketing API section","Generate a long-lived access token with reporting read permissions","Copy the token"],"direct_link":"https://developers.tiktok.com"}}]$json$,
  true,
  false,
  true,
  6
)
ON CONFLICT (slug) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  category = EXCLUDED.category,
  credential_fields = EXCLUDED.credential_fields,
  can_run_ads = EXCLUDED.can_run_ads,
  sync_enabled = EXCLUDED.sync_enabled,
  sort_order = EXCLUDED.sort_order;

-- 7. X (Twitter) Ads
INSERT INTO platform_catalog (slug, display_name, category, credential_fields, can_run_ads, sync_enabled, is_active, sort_order)
VALUES (
  'x_ads',
  'X (Twitter) Ads',
  'ads',
  $json$[{"key":"account_id","label":"Ads Account ID","type":"text","required":true,"placeholder":"abc123xyz","help":"Your X Ads account identifier.","walkthrough":{"title":"How to find your Ads Account ID","steps":["Go to X Ads → ads.x.com","Your Account ID is in the URL or under account settings"],"direct_link":"https://ads.x.com"}},{"key":"consumer_key","label":"API Key (Consumer Key)","type":"secret","required":true,"placeholder":"xxxxxxxxxxxxxxxxxxxxxxxxx","help":"OAuth 1.0a consumer key from the X Developer Portal.","walkthrough":{"title":"How to get API credentials","steps":["Go to X Developer Portal → developer.x.com","Create a project and app (or select existing)","Go to 'Keys and Tokens' tab","Copy the 'API Key' (also called Consumer Key)"],"direct_link":"https://developer.x.com/en/portal/dashboard"}},{"key":"consumer_secret","label":"API Secret (Consumer Secret)","type":"secret","required":true,"placeholder":"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx","help":"Paired with the API Key above.","walkthrough":{"title":"Where to find the API Secret","steps":["Same page as the API Key → 'Keys and Tokens' tab","Copy the 'API Secret' (also called Consumer Secret)"]}},{"key":"access_token","label":"Access Token","type":"secret","required":true,"placeholder":"1234567890-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx","help":"OAuth 1.0a access token.","walkthrough":{"title":"How to generate Access Token","steps":["On the 'Keys and Tokens' tab, scroll to 'Authentication Tokens'","Click 'Generate' under Access Token and Secret","Make sure permissions are set to Read at minimum"]}},{"key":"access_token_secret","label":"Access Token Secret","type":"secret","required":true,"placeholder":"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx","help":"Paired with the Access Token above.","walkthrough":{"title":"Where to find the Access Token Secret","steps":["Generated at the same time as the Access Token above","Copy it immediately — it's only shown once"]}}]$json$,
  true,
  false,
  true,
  7
)
ON CONFLICT (slug) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  category = EXCLUDED.category,
  credential_fields = EXCLUDED.credential_fields,
  can_run_ads = EXCLUDED.can_run_ads,
  sync_enabled = EXCLUDED.sync_enabled,
  sort_order = EXCLUDED.sort_order;

-- 8. Pinterest Ads
INSERT INTO platform_catalog (slug, display_name, category, credential_fields, can_run_ads, sync_enabled, is_active, sort_order)
VALUES (
  'pinterest_ads',
  'Pinterest Ads',
  'ads',
  $json$[{"key":"ad_account_id","label":"Ad Account ID","type":"text","required":true,"placeholder":"123456789012","help":"Your Pinterest Ads account ID.","walkthrough":{"title":"How to find your Ad Account ID","steps":["Go to Pinterest Ads Manager → ads.pinterest.com","Click your profile → 'Ad accounts'","Your Ad Account ID is listed next to each account"],"direct_link":"https://ads.pinterest.com"}},{"key":"access_token","label":"Access Token","type":"secret","required":true,"placeholder":"pina_xxxxxxxxxx","help":"Pinterest API access token with ads:read scope.","walkthrough":{"title":"How to get an Access Token","steps":["Go to Pinterest Developers → developers.pinterest.com","Create an app or select existing","Generate a token with ads:read scope","Copy the access token"],"direct_link":"https://developers.pinterest.com/apps/"}}]$json$,
  true,
  false,
  true,
  8
)
ON CONFLICT (slug) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  category = EXCLUDED.category,
  credential_fields = EXCLUDED.credential_fields,
  can_run_ads = EXCLUDED.can_run_ads,
  sync_enabled = EXCLUDED.sync_enabled,
  sort_order = EXCLUDED.sort_order;

-- 9. LinkedIn Ads
INSERT INTO platform_catalog (slug, display_name, category, credential_fields, can_run_ads, sync_enabled, is_active, sort_order)
VALUES (
  'linkedin_ads',
  'LinkedIn Ads',
  'ads',
  $json$[{"key":"account_id","label":"Ad Account ID","type":"text","required":true,"placeholder":"123456789","help":"Your LinkedIn Ads account ID (numeric).","walkthrough":{"title":"How to find your Ad Account ID","steps":["Go to LinkedIn Campaign Manager → linkedin.com/campaignmanager","Select your account","The Account ID is in the URL: /accounts/XXXXXXXXX/"],"direct_link":"https://www.linkedin.com/campaignmanager"}},{"key":"access_token","label":"Access Token","type":"secret","required":true,"placeholder":"AQVxxxxxxxxxxxxxxxx","help":"OAuth 2.0 access token with r_ads_reporting scope.","walkthrough":{"title":"How to generate an Access Token","steps":["Go to LinkedIn Developers → developer.linkedin.com","Create or select your app","Under 'Auth' tab, note your Client ID and Secret","Use the OAuth 2.0 flow to generate a token with r_ads_reporting scope"],"direct_link":"https://developer.linkedin.com/"}}]$json$,
  true,
  false,
  true,
  9
)
ON CONFLICT (slug) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  category = EXCLUDED.category,
  credential_fields = EXCLUDED.credential_fields,
  can_run_ads = EXCLUDED.can_run_ads,
  sync_enabled = EXCLUDED.sync_enabled,
  sort_order = EXCLUDED.sort_order;

-- 10. Yelp
INSERT INTO platform_catalog (slug, display_name, category, credential_fields, can_run_ads, sync_enabled, is_active, sort_order)
VALUES (
  'yelp',
  'Yelp',
  'reviews',
  $json$[{"key":"business_id","label":"Yelp Business ID","type":"text","required":true,"placeholder":"my-business-miami","help":"Your Yelp business alias (the slug from your Yelp URL).","walkthrough":{"title":"How to find your Business ID","steps":["Go to your business page on Yelp","Look at the URL: yelp.com/biz/YOUR-BUSINESS-ID","Copy everything after /biz/"],"direct_link":"https://www.yelp.com"}},{"key":"api_key","label":"Yelp Fusion API Key","type":"secret","required":true,"placeholder":"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx","help":"API key from the Yelp Fusion developer program.","walkthrough":{"title":"How to get a Yelp API Key","steps":["Go to Yelp Fusion → fusion.yelp.com","Sign up or log in","Create an app","Your API Key is on the app's detail page"],"direct_link":"https://fusion.yelp.com"}}]$json$,
  false,
  false,
  true,
  10
)
ON CONFLICT (slug) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  category = EXCLUDED.category,
  credential_fields = EXCLUDED.credential_fields,
  can_run_ads = EXCLUDED.can_run_ads,
  sync_enabled = EXCLUDED.sync_enabled,
  sort_order = EXCLUDED.sort_order;

-- 11. Microsoft/Bing Ads
INSERT INTO platform_catalog (slug, display_name, category, credential_fields, can_run_ads, sync_enabled, is_active, sort_order)
VALUES (
  'bing_ads',
  'Microsoft/Bing Ads',
  'ads',
  $json$[{"key":"account_id","label":"Account ID","type":"text","required":true,"placeholder":"123456789","help":"Your Microsoft Advertising account number.","walkthrough":{"title":"How to find your Account ID","steps":["Go to Microsoft Advertising → ads.microsoft.com","Click the gear icon → 'Accounts & Billing'","Your Account number is listed in the table"],"direct_link":"https://ads.microsoft.com"}},{"key":"customer_id","label":"Customer ID","type":"text","required":true,"placeholder":"123456789","help":"Your Microsoft Advertising customer number.","walkthrough":{"title":"How to find your Customer ID","steps":["Same page as Account ID: Accounts & Billing","The Customer ID is listed at the top of the page"]}},{"key":"developer_token","label":"Developer Token","type":"secret","required":true,"placeholder":"xxxxxxxxxxxxxxxx","help":"Required for Bing Ads API access.","walkthrough":{"title":"How to get a Developer Token","steps":["Go to Microsoft Advertising Developer Portal","Sign in with your Microsoft account","Request a developer token"],"direct_link":"https://developers.ads.microsoft.com/Account"}},{"key":"oauth_refresh_token","label":"OAuth Refresh Token","type":"secret","required":true,"placeholder":"M.xxxxxxxxxxxxxxxx","help":"OAuth 2.0 refresh token for offline API access.","walkthrough":{"title":"How to generate a Refresh Token","steps":["Register your app in Azure Portal → portal.azure.com","Go to Azure Active Directory → App registrations → New registration","Note the Application (client) ID","Under Certificates & Secrets, create a client secret","Use the OAuth consent flow to get a refresh token"],"direct_link":"https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps"}}]$json$,
  true,
  false,
  true,
  11
)
ON CONFLICT (slug) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  category = EXCLUDED.category,
  credential_fields = EXCLUDED.credential_fields,
  can_run_ads = EXCLUDED.can_run_ads,
  sync_enabled = EXCLUDED.sync_enabled,
  sort_order = EXCLUDED.sort_order;

-- 12. Snapchat Ads
INSERT INTO platform_catalog (slug, display_name, category, credential_fields, can_run_ads, sync_enabled, is_active, sort_order)
VALUES (
  'snapchat_ads',
  'Snapchat Ads',
  'ads',
  $json$[{"key":"ad_account_id","label":"Ad Account ID","type":"text","required":true,"placeholder":"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx","help":"Your Snapchat Ad Account ID (UUID format).","walkthrough":{"title":"How to find your Ad Account ID","steps":["Go to Snapchat Ads Manager → ads.snapchat.com","Click on your organization name","Select 'Ad Accounts' from the menu","The Ad Account ID is shown (UUID format)"],"direct_link":"https://ads.snapchat.com"}},{"key":"access_token","label":"Access Token","type":"secret","required":true,"placeholder":"xxxxxxxxxxxxxxxxxxxxxxxx","help":"OAuth access token from Snap Marketing API.","walkthrough":{"title":"How to get an Access Token","steps":["Go to Snap Kit Developer Portal → kit.snapchat.com","Create or select your app","Under Marketing API, generate OAuth credentials","Complete the OAuth flow to get access + refresh tokens"],"direct_link":"https://kit.snapchat.com/manage/"}},{"key":"refresh_token","label":"Refresh Token","type":"secret","required":true,"placeholder":"xxxxxxxxxxxxxxxxxxxxxxxx","help":"Used to automatically renew the access token.","walkthrough":{"title":"Where to find the Refresh Token","steps":["Generated during the same OAuth flow as the Access Token","Copy it immediately and store securely"]}}]$json$,
  true,
  false,
  true,
  12
)
ON CONFLICT (slug) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  category = EXCLUDED.category,
  credential_fields = EXCLUDED.credential_fields,
  can_run_ads = EXCLUDED.can_run_ads,
  sync_enabled = EXCLUDED.sync_enabled,
  sort_order = EXCLUDED.sort_order;
