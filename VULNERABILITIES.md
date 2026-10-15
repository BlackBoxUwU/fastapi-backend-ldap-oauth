# Security Assessment - Backend Node.js API

- **Target:** `http://backend:3000`
- **Tool:** ProjectDiscovery Nuclei v3.11.1, templates v10.5.0
- **Scan date:** 2026-10-15
- **Scope:** 11,102 templates loaded; 13,209 HTTP connections

## Current Scan Summary

| Severity | Findings |
|:---|---:|
| Critical | 0 |
| High | 0 |
| Medium | 0 |
| Low / Info | 1 |

The current scan reports only the missing HSTS header. It did not report the earlier development-mode finding or missing security headers.

## Remaining Match

- **`http-missing-security-headers:strict-transport-security`**
  - The API currently serves plain HTTP. HSTS is meaningful only after a trusted HTTPS endpoint is configured; setting it on HTTP responses would not secure the transport.

## Code Changes Verified

- Added CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, CORP, COEP, COOP, and `X-Permitted-Cross-Domain-Policies`. Nuclei no longer reports the backend's previously missing headers.
- Restricted CORS to the configured dashboard origin (`FRONTEND_ORIGIN`, default `http://localhost:8080`). Requests from an unrelated origin receive no `Access-Control-Allow-Origin` response header.
- Disabled Express's `X-Powered-By` response header. The current scan no longer identifies Express.
- `NODE_ENV=production` is set in the Dockerfile; the earlier `node-express-dev-env` finding did not recur.

## Remaining Work

Configure HTTPS with a trusted certificate before enabling HSTS.
