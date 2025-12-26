# Deployment Guide: Cloudflare Workers

This guide details the process for deploying the URL Shortener/Redirect service to Cloudflare Workers, managing secrets, and configuring custom domains.

## 1. Prerequisites

Before you begin, ensure you have:

1.  **Cloudflare Account**: You must have an active Cloudflare account.
2.  **Domain Added**: The domain `fwg.vn` must be active in your Cloudflare account.
3.  **Wrangler CLI**: The project uses `wrangler` for deployment (included in `package.json`).

### Login to Cloudflare

Run the following command to authenticate your local environment with Cloudflare:

```bash
npx wrangler login
```

A browser window will open ask you to authorize Wrangler.

## 2. Configuration (`wrangler.toml`)

The project uses `wrangler.toml` to manage configurations for different environments (`dev`, `staging`, `production`).

### Domain Mapping (Routes)

For the **production** environment, we have configured a custom route to map your worker to your domain.

File: `wrangler.toml`

```toml
[env.production]
name = "cloudflare_redirect_production"
routes = [
  { pattern = "fwg.vn/*", zone_name = "fwg.vn" }
]
```

**What this does:**

- **pattern**: Tells Cloudflare to route all traffic matching `fwg.vn/*` (e.g., `fwg.vn/r/123`, `fwg.vn/about`) to this Worker.
- **zone_name**: Specifies the Cloudflare Zone (domain) this route belongs to.

> [!NOTE]
> If you want to use a subdomain instead (e.g., `link.fwg.vn`), update the pattern to `link.fwg.vn/*`.

### Global Variables

Review the `[env.production.vars]` section to ensure `DEFAULT_REDIRECT_URL` and `ALLOWED_DOMAINS` are correct for production.

## 3. Secrets Management

Sensitive information like API keys must **not** be stored in code or `wrangler.toml`. We use Cloudflare Secrets for this.

### Required Secrets

- `GA4_API_SECRET`: Required for Google Analytics 4 tracking.

### Setting Secrets

Use the provided npm scripts to set secrets for the production environment.

**1. Set GA4 API Secret:**

```bash
npm run secret:prod
```

_When prompted, paste your GA4 API Secret value._

Or manually using Wrangler:

```bash
npx wrangler secret put GA4_API_SECRET --env production
```

## 4. Deployment

### Deploy to Production

Once secrets are set and configuration is verified, deploy to production:

```bash
npm run deploy:prod
```

This command runs `wrangler deploy --env production`, which:

1.  Bundles your code.
2.  Uploads it to Cloudflare.
3.  Updates the routes for `fwg.vn`.

### Deploy to Staging (Optional)

If you want to test on a staging worker (usually on a `*.workers.dev` subdomain unless configured otherwise):

```bash
npm run deploy:staging
```

## 5. Verification

After deployment:

1.  **Health Check**: Visit `https://fwg.vn/r/health`. You should see a healthy status response.
2.  **Redirect Test**: Test a known redirect or the default fallback.
3.  **Analytics**: Verify that events are appearing in your Google Analytics Realtime view (if configured).

## Troubleshooting

- **Deployment Defaults**: If the deploy fails claiming a route is invalid, ensure the domain `fwg.vn` is in the same Cloudflare account you logged into.
- **Secrets Not Found**: If the worker errors with "missing secret", verify you set the secret specifically for the `--env production` environment.
