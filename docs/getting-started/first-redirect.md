# Your First Redirect

↖️ **[Back to README](../../README.md)** | **[Docs Index](../README.md)** | **[Getting Started](./README.md)**

---

## Overview

In this 5-minute tutorial, you'll create and test your first redirect using the cloudflareRedirect service.

**What you'll learn:**
- How to use the `/r` redirect endpoint
- How to test redirects locally
- How to use debug mode

---

## Step 1: Start Development Server

```bash
npm run dev
```

Wait for:
```
✔ Ready on http://localhost:8787
```

---

## Step 2: Test Basic Redirect

### Using cURL

```bash
curl -I "http://localhost:8787/r?to=https://google.com"
```

**Expected output:**
```
HTTP/1.1 302 Found
Location: https://google.com
Cache-Control: no-cache
```

**✅ Success!** The service returned a 302 redirect.

### Using Browser

Open your browser:
```
http://localhost:8787/r?to=https://google.com
```

You should be **automatically redirected** to Google.

---

## Step 3: Test with URL Parameters

Redirects preserve query parameters from the destination URL.

```bash
curl -I "http://localhost:8787/r?to=https://example.com?utm_source=test&utm_campaign=demo"
```

**Expected:**
```
HTTP/1.1 302 Found
Location: https://example.com?utm_source=test&utm_campaign=demo
```

The destination URL kept its parameters intact!

---

## Step 4: Debug Mode

Debug mode returns JSON instead of redirecting (useful for testing).

```bash
curl "http://localhost:8787/r?to=https://google.com&debug=1"
```

**Expected output:**
```json
{
  "destination": "https://google.com",
  "tracking_params": {},
  "redirect_type": "302",
  "note": "Debug mode - redirect suppressed"
}
```

---

## Step 5: Test Legacy URL Format

The service supports legacy `/#url` format and auto-upgrades it.

### Using Browser

Open:
```
http://localhost:8787/#https://google.com
```

**What happens:**
1. JavaScript extracts `https://google.com` from hash fragment
2. Redirects to `/r?to=https://google.com`
3. Server performs final redirect to destination

---

## Common Test Scenarios

### 1. Redirect to Any Website

```bash
curl -I "http://localhost:8787/r?to=https://github.com"
curl -I "http://localhost:8787/r?to=https://stackoverflow.com"
curl -I "http://localhost:8787/r?to=https://youtube.com"
```

### 2. Redirect with Complex Parameters

```bash
curl -I "http://localhost:8787/r?to=https://example.com?param1=value1&param2=value2&param3=value3"
```

### 3. URL Encoding

For complex URLs, use URL encoding:
```bash
# Raw URL
curl -I "http://localhost:8787/r?to=$(echo 'https://example.com?q=hello world' | jq -sRr @uri)"

# Or manually encode
curl -I "http://localhost:8787/r?to=https%3A%2F%2Fexample.com%3Fq%3Dhello%20world"
```

---

## Understanding Redirect Types

The service uses **302 (Temporary) redirects** by default.

- **302 Found:** Temporary redirect (search engines won't transfer SEO)
- **301 Moved Permanently:** (Future feature) Permanent redirect

---

## Error Handling

### Missing `to` Parameter

```bash
curl "http://localhost:8787/r"
```

**Response:**
```json
{
  "error": "Missing destination parameter",
  "code": "MISSING_PARAM"
}
```

### Invalid URL Format

```bash
curl "http://localhost:8787/r?to=not-a-valid-url"
```

**Response:**
```json
{
  "error": "Only HTTP/HTTPS URLs allowed",
  "code": "INVALID_URL"
}
```

---

## What You've Learned

✅ How to use the `/r` endpoint
✅ How to test redirects with cURL and browser
✅ How to use debug mode
✅ How to handle URL parameters
✅ How legacy URLs are upgraded
✅ Common error responses

---

## Next Steps

- → **[Configuration](./configuration.md)** - Enable analytics tracking
- → **[How It Works](./how-it-works.md)** - Understand the redirect flow
- → **[Developer Guide](../guides/developer-guide.md)** - Start building features

---

## Need Help?

- **Redirect not working?** Check [Troubleshooting](./installation.md#troubleshooting)
- **Want to customize?** See [Configuration Guide](./configuration.md)
- **Ready to deploy?** See [Deployment Guide](../guides/deployment-guide.md)

---

↖️ **[Back to README](../../README.md)** | **[Docs Index](../README.md)** | **[Getting Started](./README.md)**
