# Multi-Domain Storefront Implementation Guide
**Host Customer Storefronts on `mycedinetstore.com` & Manage Everything on `mycedinet.com` (Same VPS)**

---

## Executive Summary & Architecture

This guide provides the complete blueprint and step-by-step instructions to host customer-facing storefronts on a dedicated, clean domain (e.g. `https://mycedinetstore.com/loveagostore`) while allowing users to manage products, pricing, orders, and commissions on the main platform (`https://mycedinet.com`), all hosted on the **same VPS**.

### Recommended Architecture: Unified Multi-Domain Single-App

```text
                                 [ VPS (Ubuntu 22/24 LTS) ]
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      │                 Nginx Proxy                   │
                      │             Ports 80 / 443 (SSL)              │
                      └───────┬───────────────────────────────┬───────┘
                              │ Host: mycedinet.com           │ Host: mycedinetstore.com
                              ▼                               ▼
                      ┌───────────────────────────────────────────────┐
                      │        Single Next.js App (Port 3000)         │
                      │                  (PM2 Node)                   │
                      │                                               │
                      │  Next.js Middleware Domain Router:            │
                      │  • mycedinetstore.com/loveagostore            │
                      │    ──(rewrite)──> /store/loveagostore         │
                      │  • mycedinet.com/dashboard                    │
                      │    ──(normal)───> /dashboard                  │
                      └───────────────────────┬───────────────────────┘
                                              │
                                              ▼
                                 PostgreSQL Database (Local)
                              • Users & Storefront settings
                              • StorefrontOrders & Transactions
                              • Commission Wallets
```

### Key Architectural Benefits:
1. **Zero Database Sync Complexity**: Since both domains connect to the same PostgreSQL database, orders placed on `mycedinetstore.com` immediately update the seller's commission wallet visible on `mycedinet.com`.
2. **Minimal VPS Resource Footprint**: Running one optimized Next.js app in PM2 cluster mode uses 50% less RAM than launching separate apps.
3. **Clean URLs for Customers**: Buyers visit `https://mycedinetstore.com/loveagostore` directly (no ugly `/store/` prefix required in the browser).
4. **Isolated Security**: Requests to `/admin` or `/dashboard` arriving on `mycedinetstore.com` are automatically redirected to `https://mycedinet.com/login`.

---

## Step 1: DNS Configuration (How & Why Both Domains Share Your VPS IP)

### "I already have `mycedinet.com` @ and www pointed to my VPS IP, so what should I do with `mycedinetstore.com`?"

**You do the exact same thing for `mycedinetstore.com`!**

> **How this works**:
> A VPS has a single public IP address. Both `mycedinet.com` and `mycedinetstore.com` can point to that **same IP**. When a user's browser makes a request, it sends an HTTP header called `Host` (e.g., `Host: mycedinetstore.com` or `Host: mycedinet.com`).
> - Nginx listens on that single IP on ports 80/443.
> - When Nginx sees `Host: mycedinet.com`, it serves the main portal.
> - When Nginx sees `Host: mycedinetstore.com`, it serves the customer storefronts and the inquisitive homepage.

### In your DNS manager for `mycedinetstore.com` (Namecheap, Cloudflare, GoDaddy, etc.):
Add these DNS **A records** pointing to the **exact same VPS IP**:

| Type | Host / Name | Value / Destination | TTL | Description |
| :--- | :--- | :--- | :--- | :--- |
| **A** | `@` | `<YOUR_VPS_IP>` | Auto / 1 min | Points root `mycedinetstore.com` to your VPS |
| **A** | `www` | `<YOUR_VPS_IP>` | Auto / 1 min | Points `www.mycedinetstore.com` to your VPS |

*(Do NOT touch or delete your existing records for `mycedinet.com` — both domains will happily live on the same VPS).*


---

## Step 2: Nginx Reverse Proxy Configuration on VPS

Create a dedicated Nginx configuration for `mycedinetstore.com`. This keeps configuration clean and modular alongside `/etc/nginx/sites-available/mycedinet.com`.

### 1. Create `/etc/nginx/sites-available/mycedinetstore.com`
Run on your VPS:
```bash
sudo cat << 'EOF' > /etc/nginx/sites-available/mycedinetstore.com
server {
    listen 80;
    listen [::]:80;
    server_name mycedinetstore.com www.mycedinetstore.com;

    client_max_body_size 250M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';

        # Standard multi-tenant proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;

        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 120s;
        proxy_connect_timeout 60s;
    }

    # Static file caching
    location /_next/static/ {
        alias /var/www/mycedinet/.next/static/;
        expires 365d;
        access_log off;
    }
}
EOF
```

### 2. Enable Site & Reload Nginx
```bash
sudo ln -sf /etc/nginx/sites-available/mycedinetstore.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Step 3: SSL Certificate via Certbot (HTTPS)

Issue a free Let's Encrypt SSL certificate for `mycedinetstore.com`:
```bash
sudo certbot --nginx -d mycedinetstore.com -d www.mycedinetstore.com --non-interactive --agree-tos -m admin@mycedinet.com --redirect
```

---

## Step 4: Environment Variables (`.env`)

Add domain configuration variables to `/var/www/mycedinet/.env` (and local `.env`):

```bash
# Main Management Domain
MAIN_DOMAIN="mycedinet.com"
NEXT_PUBLIC_MAIN_DOMAIN="mycedinet.com"

# Dedicated Storefront Domain
STOREFRONT_DOMAIN="mycedinetstore.com"
NEXT_PUBLIC_STOREFRONT_DOMAIN="mycedinetstore.com"
```

---

## Step 5: Next.js Multi-Domain Middleware Router

Update `src/middleware.ts` to handle host-based routing.

### What the Middleware Does:
1. **Detects Domain**: Checks if incoming request is for `mycedinetstore.com` or `mycedinet.com`.
2. **Clean URL Rewrite**: When a visitor enters `https://mycedinetstore.com/loveagostore`, Next.js internally rewrites it to `/store/loveagostore` so the existing App Router code (`src/app/store/[slug]/...`) handles it without changing the URL in the browser!
3. **Sub-Route Support**:
   - `mycedinetstore.com/loveagostore/mtn` -> `/store/loveagostore/mtn`
   - `mycedinetstore.com/loveagostore/track` -> `/store/loveagostore/track`
   - `mycedinetstore.com/loveagostore/order/MCD-xxx` -> `/store/loveagostore/order/MCD-xxx`
4. **Security Isolation**: If someone visits `mycedinetstore.com/admin` or `mycedinetstore.com/dashboard`, they are redirected to `https://mycedinet.com/login`.
5. **API & Static Passthrough**: `/api/...` and static files pass through transparently.

### Code for `src/middleware.ts`:

```typescript
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "mycedinet_session";
const secretString = process.env.AUTH_SECRET || "dev-insecure-secret-change-me-replace-in-prod";
const secret = new TextEncoder().encode(secretString);

const ADMIN_ONLY_PREFIXES = [
  "/admin/users",
  "/admin/settings",
  "/admin/api",
  "/admin/audit-logs",
  "/admin/pricing",
  "/admin/packages",
];

const STOREFRONT_DOMAIN = (process.env.STOREFRONT_DOMAIN || "mycedinetstore.com").toLowerCase();
const MAIN_DOMAIN = (process.env.MAIN_DOMAIN || "mycedinet.com").toLowerCase();

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const rawHost = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  const host = rawHost.split(":")[0].toLowerCase();
  const isStorefrontDomain = host === STOREFRONT_DOMAIN || host === `www.${STOREFRONT_DOMAIN}`;

  // 1. STOREFRONT DOMAIN ROUTING (mycedinetstore.com)
  if (isStorefrontDomain) {
    if (pathname.startsWith("/admin") || pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(`https://${MAIN_DOMAIN}/login`);
    }

    if (
      pathname.startsWith("/api") ||
      pathname.startsWith("/_next") ||
      pathname.includes(".")
    ) {
      return NextResponse.next();
    }

    if (pathname.startsWith("/store/")) {
      const cleanPath = pathname.replace(/^\/store/, "");
      const cleanUrl = request.nextUrl.clone();
      cleanUrl.pathname = cleanPath;
      return NextResponse.redirect(cleanUrl);
    }

    if (pathname === "/" || pathname === "") {
      const url = request.nextUrl.clone();
      url.pathname = "/store";
      return NextResponse.rewrite(url);
    }

    const url = request.nextUrl.clone();
    url.pathname = `/store${pathname}`;
    return NextResponse.rewrite(url);
  }

  // 2. MAIN PLATFORM ROUTING (mycedinet.com)
  const token =
    request.cookies.get(SESSION_COOKIE)?.value ||
    request.cookies.get("tskconnect_session")?.value;
  let payload: { role?: unknown; tv?: unknown } | null = null;
  if (token) {
    try {
      const { payload: verified } = await jwtVerify(token, secret, {
        issuer: ["mycedinet", "tskconnect"],
      });
      payload = verified as { role?: unknown; tv?: unknown };
    } catch {
      payload = null;
    }
  }

  const role = typeof payload?.role === "string" ? payload.role : null;
  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (isAuthPage && role) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (!pathname.startsWith("/admin") && !pathname.startsWith("/api/admin")) {
    if (isAuthPage) return NextResponse.next();
  }

  // Protect admin pages
  if (pathname.startsWith("/admin")) {
    if (!role) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = `?next=${encodeURIComponent(pathname + search)}`;
      return NextResponse.redirect(url);
    }
    if (role !== "ADMIN" && role !== "MANAGER") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }
    if (
      role !== "ADMIN" &&
      ADMIN_ONLY_PREFIXES.some((p) => pathname.startsWith(p))
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  // Friendly /@slug redirects to the dedicated storefront domain
  if (pathname.startsWith("/@")) {
    const slug = pathname.slice(2).replace(/\/+$/, "");
    if (/^[a-z0-9-]{3,32}$/.test(slug)) {
      return NextResponse.redirect(`https://${STOREFRONT_DOMAIN}/${slug}`);
    }
  }

  return NextResponse.next();
}
```

---

## Step 5.1: The "Inquisitive Visitor" Homepage (`src/app/store/page.tsx`)

When someone visits the naked root `https://mycedinetstore.com/` without specifying a store slug, they meet an engaging **"Inquisitive Visitor"** landing page that explains what `mycedinetstore.com` is, lets them quickly enter a store name, track an existing order, or register on `mycedinet.com` to launch their own store.

---

## Step 6: Storefront Links Helper (`brands.ts`)

In `src/components/store/brands.ts`, `networkHref` supports clean paths:

```typescript
export function networkHref(storeSlug: string, network: NetworkProvider): string {
  return `/${storeSlug}/${NETWORK_BRANDS[network].slug}`;
}

export function storeHref(storeSlug: string, subpath: string = ""): string {
  const cleanSub = subpath ? (subpath.startsWith("/") ? subpath : `/${subpath}`) : "";
  return `/${storeSlug}${cleanSub}`;
}
```

---

## Step 7: User Dashboard URL Displays & Share Buttons

On `mycedinet.com`, when store owners view their Storefront dashboard, their store link and share buttons present their dedicated URL (`https://mycedinetstore.com/loveagostore`).

### In `src/app/dashboard/storefront/page.tsx`:
```tsx
const storefrontDomain = process.env.NEXT_PUBLIC_STOREFRONT_DOMAIN || "mycedinetstore.com";
const storeUrl = `https://${storefrontDomain}/${storefront.slug}`;
```

---

## Step 8: Checkout, Webhook, and Commission Settlement

### How Checkout Operates Across Domains:
1. **Customer Places Order**:
   - Customer is on `https://mycedinetstore.com/loveagostore/mtn`.
   - Buyer fills recipient phone number and clicks "Pay with Mobile Money".
   - Browser calls `POST /api/store/loveagostore/checkout`.
   - Because of Nginx proxying, this POST request hits the Next.js API on the same VPS.
2. **Paystack Initialization**:
   - `getRequestOrigin(request)` resolves to `https://mycedinetstore.com`.
   - Paystack transaction is initialized with:
     `callbackUrl: https://mycedinetstore.com/api/store/paystack/callback`
   - Customer is redirected to Paystack.
3. **Paystack Payment Verification**:
   - Customer pays via MoMo.
   - Paystack redirects buyer back to:
     `https://mycedinetstore.com/api/store/paystack/callback?reference=MCD-...`
   - The route settles the order atomically:
     - `StorefrontOrder.status` -> `COMPLETED`
     - Underlying data bundle order dispatched via provider API.
     - `StorefrontWallet.balance` is incremented by the seller's commission.
   - Buyer is redirected to their clean receipt page:
     `https://mycedinetstore.com/loveagostore/order/MCD-...`
4. **Owner Checks Commission on `mycedinet.com`**:
   - The store owner logs in at `https://mycedinet.com/dashboard/storefront/wallet`.
   - The commission is immediately visible in their balance.
   - The owner can withdraw to their main wallet or request a direct MoMo payout.

---

## Step 9: Testing & Verification Checklist

### 1. Verification with `curl`
Test domain routing on the VPS before going public:
```bash
# Test storefront routing
curl -I -H "Host: mycedinetstore.com" http://127.0.0.1:3000/loveagostore
# Expected: HTTP 200 (serves store page)

# Test security redirect
curl -I -H "Host: mycedinetstore.com" http://127.0.0.1:3000/admin
# Expected: HTTP 307/308 Redirect to https://mycedinet.com/login

# Test main platform
curl -I -H "Host: mycedinet.com" http://127.0.0.1:3000/dashboard
# Expected: Normal app response
```

### 2. Live Browser Testing
1. Visit `https://mycedinetstore.com/loveagostore` in an incognito window:
   - Store banner, products, and prices load correctly.
2. Select MTN / Telecel and place a test bundle order.
3. Complete test payment on Paystack.
4. Verify redirection to `https://mycedinetstore.com/loveagostore/order/MCD-...`.
5. Open `https://mycedinet.com/dashboard/storefront/wallet` in another window:
   - Commission is reflected immediately in available balance.
   - Order is listed in Storefront Orders table.
