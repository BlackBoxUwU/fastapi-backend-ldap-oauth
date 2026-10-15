# Security Vulnerability Assessment Report - Backend Node.js API

- **Target Component:** Backend Security & Secret Rotation REST API (`http://backend:3000`)
- **Scan Tool:** ProjectDiscovery Nuclei v3.11.1 (Templates v10.5.0)
- **Scan Date:** 2026-10-15
- **Assessment Scope:** Dynamic Application Security Testing (DAST); 11,102 templates loaded.

---

## Summary of Identified Findings

Nuclei reported 9 findings, all with **Info** severity. These are informational detections and hardening gaps, not evidence of 9 exploitable vulnerabilities.

| Severity | Count | Status |
|:---|:---:|:---|
| **Critical** | 0 | None detected |
| **High** | 0 | None detected |
| **Medium** | 0 | None detected |
| **Low / Info** | 9 | 8 missing-header findings and 1 technology fingerprint |

---

## Detailed Findings

### 1. Missing HTTP Security Headers

Nuclei reported these eight missing headers:

- **`http-missing-security-headers:x-frame-options`**
- **`http-missing-security-headers:strict-transport-security` (HSTS)**
- **`http-missing-security-headers:referrer-policy`**
- **`http-missing-security-headers:permissions-policy`**
- **`http-missing-security-headers:x-permitted-cross-domain-policies`**
- **`http-missing-security-headers:cross-origin-embedder-policy` (COEP)**
- **`http-missing-security-headers:cross-origin-opener-policy` (COOP)**
- **`http-missing-security-headers:cross-origin-resource-policy` (CORP)**

HSTS requires HTTPS to be useful; the API is currently served over HTTP.

### 2. Technology Fingerprinting

- **`tech-detect:express`**
  - **Finding:** Nuclei identifies the Express framework.
  - **Remediation:** Disable the `X-Powered-By` header and review other response details that disclose the framework. This scan result alone does not establish an exploitable vulnerability.

### 3. Development Environment Finding from the Earlier Scan

- **`node-express-dev-env`**
  - **Status:** Not reported by the 2026-10-15 scan. `NODE_ENV=production` is set in the backend Dockerfile.
  - **Note:** The earlier finding is considered mitigated in the current image; retain this status only while the production environment setting remains in effect.

---

## Scan Notes

Nuclei also probed ports `5814` and `4040`, which refused connections. These are closed ports, not findings against the backend's configured API port `3000`.

## Remediation Plan

1. **Block 1:** Set `NODE_ENV=production` in the Dockerfile. The development-environment finding did not recur in this scan.
2. **Next:** Add appropriate API security headers and disable framework fingerprinting.
3. **Later:** Configure HTTPS before enabling HSTS.
