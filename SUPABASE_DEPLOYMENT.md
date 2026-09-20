# TATVa backend deployment

The frontend remains usable in local/demo mode. Production mode requires Supabase Auth, Postgres, Storage, and Edge Functions.

## 1. Create the project

Install the Supabase CLI, create a project, and link this repository:

```powershell
supabase login
supabase link --project-ref <project-ref>
```

Apply the control-plane and storage migrations:

```powershell
supabase db push
```

The existing accounting SQL from `src/services/sqlSchemaGenerator.ts` should also be applied after reviewing the generated RLS policies. Do not use the old permissive policies in production.

## 2. Configure secrets

Set these secrets in Supabase. Never put them in Vite environment variables or browser localStorage:

```powershell
supabase secrets set APP_ORIGIN=https://app.example.com
supabase secrets set PAYMENT_PROVIDER=razorpay
supabase secrets set RAZORPAY_KEY_ID=<server-key-id>
supabase secrets set RAZORPAY_KEY_SECRET=<server-secret>
supabase secrets set PAYMENT_WEBHOOK_SECRET=<webhook-secret>
supabase secrets set META_ACCESS_TOKEN=<meta-token>
supabase secrets set META_PHONE_NUMBER_ID=<phone-number-id>
supabase secrets set MESSAGING_PROVIDER=meta
supabase secrets set BACKUP_BUCKET=platform-backups
```

## 3. Deploy functions

```powershell
supabase functions deploy api
supabase functions deploy provision-tenant
supabase functions deploy payment-create
supabase functions deploy payment-webhook --no-verify-jwt
supabase functions deploy message-send
supabase functions deploy messaging-webhook --no-verify-jwt
supabase functions deploy backup-run
supabase functions deploy health-check --no-verify-jwt
supabase functions deploy automation-run
supabase functions deploy domain-verify
```

Configure the payment and messaging provider dashboards to send webhooks to the deployed function URLs. Verify webhook signatures in the provider-specific production adapter before accepting live events.

## 4. Authentication and MFA

Enable email/password or OIDC in Supabase Auth. Require TOTP MFA for platform administrators. Create a `platform_profiles` row for each platform administrator and add a `tenant_memberships` row for each tenant user. The database policies and Edge Functions reject users without those records.

## 5. Frontend configuration

In the app's Cloud Sync settings, configure the Supabase project URL and anon key. The anon key is safe for the browser only when RLS is enabled. Service-role keys and provider secrets must never be shipped to the frontend.

## Current provider boundaries

- Razorpay: live order creation is implemented; webhook signature verification must be completed with the selected provider's exact signing scheme before production launch.
- WhatsApp: Meta Cloud API sending and delivery callback storage are implemented; approved templates and Meta credentials are required.
- Backups: backup job creation and private storage buckets are implemented; a scheduled worker must serialize tenant data and upload encrypted archives.
- Hosting/domains: health and SSL reachability verification are implemented; DNS/SSL provisioning still requires Cloudflare, Route 53, or the selected hosting provider's credentials.
- Analytics/automation: tenant-safe analytics and job tables are implemented; schedule `automation-run` with Supabase Cron or an external scheduler.
