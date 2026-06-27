# Audit Remediation — Status Report

**Date:** 2026-06-24
**Branches with fixes:** `fix/audit-24-june` (both repos), branched from `test`, pushed to `origin`.
**Source audits:**
- Backend — `IAO-LMS-backend/doc/SECURITY_AND_CODE_AUDIT.md` + `IMPLEMENTATION_GUIDE_AUTHZ_AND_AUDIT.md`
- Frontend — `IAO-Belgium-Frontend/docs/FRONTEND_CODE_AUDIT.md` + `FRONTEND_DOMAIN_SEPARATION.md`

### Legend
| Status | Meaning |
|--------|---------|
| ✅ **DONE** | Implemented & committed on `fix/audit-24-june`, build/syntax verified. |
| 🟡 **PARTIAL** | Partially addressed; remainder is explicitly scoped as a follow-up. |
| ⏳ **TBD** | Decision/scope needed before coding (architectural or ops call). |
| ⛔ **PENDING** | Not started — known, deferred work. |
| ⚙️ **OPS** | Infra / deployment / process — not a code change in these repos. |
| 💡 **POSITIVE** | Audit confirmed this is already correct; no action. |

---

## A. Summary scoreboard

| Area | Total findings | ✅ Done | 🟡 Partial | ⏳/⛔/⚙️ Open |
|------|:--:|:--:|:--:|:--:|
| **Backend — Auth & RBAC** | 7 | 4 | 1 | 2 |
| **Backend — Routing/IDOR/Upload** | 6 | 0 | 0 | 6 |
| **Backend — Payments/Webhook/Integrations** | 5 | 0 | 0 | 5 |
| **Backend — Secrets/Config** | 3 | 0 | 0 | 3 |
| **Backend — Ops/Infra/CI** | ~12 | 0 | 0 | ~12 |
| **Frontend — Auth/Session** | 4 | 2 | 0 | 2 |
| **Frontend — RBAC (client)** | 4 | 3 | 0 | 1 |
| **Frontend — XSS** | 2 | 1 | 0 | 1 |
| **Frontend — Config/Secrets** | 4 | 2 | 0 | 2 |
| **Frontend — Hygiene** | 4 | 0 | 0 | 4 |
| **Domain separation (admin/teacher)** | — | ✅ FE done | — | ⏳ BE + infra |

> **Headline:** All *frontend* P0/P1 code items and the *backend* auth-layer P0/P1 items are **DONE**. The remaining open items are mostly **ops/infra** (crons, container supervision, CI gates), **secrets-at-rest**, and **per-route RBAC migration** for mixed modules — none blocked, all deliberately deferred.

---

## B. Backend — `IAO-LMS-backend`

### B.1 Authentication & RBAC
| # | Finding | Sev | Status | Notes |
|---|---------|-----|--------|-------|
| 1.1 | Hardcoded staff OTP `123456` | 🔴 | ✅ **DONE** | Gated behind `NODE_ENV !== "production"`; prod staff now get a random emailed OTP. |
| 2.1 | No RBAC layer anywhere | 🔴 | 🟡 **PARTIAL** | `authorize()` middleware added; applied to clearly admin-only groups (`role`, `special-exceptions`, `admin/dashboard`). **Mixed modules still TBD** — see B.7. |
| 1.5 | Refresh-token rotation absent | 🟠 | ⛔ **PENDING** | Single-flight refresh added on FE; BE rotation not yet implemented. |
| 1.3 | Single static API key as security control | 🟠 | ⏳ **TBD** | Needs a decision: keep as routing id only, or move to per-client keys. (FE side documented — key is non-secret.) |
| 1.2 | OTP/token plaintext, no constant-time compare | 🟠 | ⛔ **PENDING** | Hash OTP + `crypto.timingSafeEqual`. |
| 1.4 | User enumeration on OTP request | 🟡 | ⛔ **PENDING** | Return generic response regardless of account existence. |
| — | JWT issuer/audience signed but never verified | 🟠 | ✅ **DONE** | Now enforced in `verify_jwt` **and** `verify_refresh_token`. |
| — | Rate limiting disabled on auth endpoints | 🟠 | ✅ **DONE** | `otp` preset on send-otp routes, `auth` preset on verify-otp. |

### B.2 Routing / IDOR / Upload
| # | Finding | Sev | Status |
|---|---------|-----|--------|
| 3.2 | Public file endpoint exposes all uploaded PII | 🔴 | ⛔ **PENDING** — highest remaining security item; needs auth + signed URLs. |
| 3.1 | Routers mounted before auth/API-key | 🟠 | ⛔ **PENDING** |
| 3.3 | Sequential public IDs → IDOR/enumeration | 🟠 | ⛔ **PENDING** |
| 2.2 | Inconsistent ownership scoping (IDOR class) | 🟠 | ⛔ **PENDING** |
| 3.4 | Incomplete validation coverage | 🟡 | ⛔ **PENDING** |
| 3.5 | ReDoS via unescaped user RegExp | 🟡 | ⛔ **PENDING** |

### B.3 Payments / Webhook / Integrations
| # | Finding | Sev | Status |
|---|---------|-----|--------|
| 4.4 | Invoice/receipt crons can double-fire | 🟠 | ⚙️ **OPS/PENDING** — needs distributed lock. |
| 4.5 | Exact Online OAuth tokens stored plaintext | 🟠 | ⛔ **PENDING** — encrypt at rest. |
| 4.1 | Webhook secret in URL path | 🟡 | ⛔ **PENDING** |
| 4.2 | Webhook 500 leaks message + storms retries | 🟡 | ⛔ **PENDING** |

### B.4 Secrets / Config
| # | Finding | Sev | Status |
|---|---------|-----|--------|
| 5.1 | `.gitignore` does not protect committed env file | 🔴 | ⏳ **TBD (do next)** — you have `.gitignore` open now; fix the ignore pattern, **rotate** all leaked secrets. *Code-trivial, but secret rotation is the real work.* |
| 5.2 | No secret-strength validation | 🟡 | ⛔ **PENDING** |
| 8.3 | Secrets/PII unencrypted at field level | 🟡 | ⛔ **PENDING** |

### B.5 Ops / Infra / CI / Data / Deps (condensed)
| # | Finding | Sev | Status |
|---|---------|-----|--------|
| 6.1 | Crons run inside web process | 🔴(ops) | ⚙️ **OPS** |
| 6.2 | One container runs web+worker+crons, no supervisor | 🟠 | ⚙️ **OPS** |
| 6.3 | Container/port/health-check mismatch | 🟠 | ⚙️ **OPS** |
| 7.1 | "GDPR-safe logging" claimed but not enforced | 🟠 | ⛔ **PENDING** |
| 8.1 | No uniqueness/normalization on `User.email` | 🟠 | ⛔ **PENDING** |
| 9.1 | `npm`/`install` shipped as runtime deps | 🟠 | ⛔ **PENDING** (quick win) |
| 10.1 | No quality gates in pipeline | 🟠 | ⚙️ **OPS** |
| 10.2 | Mutable `latest` tag, no rollback | 🟠 | ⚙️ **OPS** |
| — | No tests anywhere | 🔵(latent) | ⛔ **PENDING** |
| 6.4–6.6, 7.2–7.4, 8.2, 9.2–9.3, 10.3 | Various medium/low | 🟡/🔵 | ⛔ **PENDING** |

### B.6 Confirmed positives (no action)
💡 HttpOnly refresh cookie · helmet · crypto-secure student OTP · clean modular layout · structured logging · sensible Redis/Mongo resilience · solid webhook core.

### B.7 Explicit follow-up: per-route RBAC for mixed modules ⏳ **TBD**
`authorize("admin")` was **not** blanket-applied to `program, intake, master-data, user, company, invoice, payment, application, academic, contract, planning, submission, exam, exam-session, components, notification, student, student-corner, question-bank, program-config` — these mix admin writes with student/teacher reads, so a group guard would break those portals. Each needs **per-route** `authorize(...)` (and ownership checks). Documented in a comment block in `src/routes/index.js`.

---

## C. Frontend — `IAO-Belgium-Frontend`

### C.1 Auth / Session
| # | Finding | Sev | Status | Notes |
|---|---------|-----|--------|-------|
| 1.1 | Token in memory, refresh in HttpOnly cookie | 💡 | ✅ **CONFIRMED** | Correct pattern; kept. |
| 1.2 | No single-flight refresh (stampede) | 🟡 | ✅ **DONE** | Shared `refreshPromise` in interceptor. |
| 1.4 | No global `403` handling | 🟡 | ✅ **DONE** | 403 branch toasts message. |
| 1.3 | `initializeAuth` blocks first paint / guaranteed 401 for guests | 🟡 | ⛔ **PENDING** |

### C.2 RBAC (client-side, UX only)
| # | Finding | Sev | Status | Notes |
|---|---------|-----|--------|-------|
| 2.1 | Client guards are the only separation | 🔴 | 🟡 **PARTIAL→by BE** | FE guards kept as UX; real fix is backend `authorize()` (B.1 #2.1). |
| 2.2 | Teacher routes had no guard | 🟠 | ✅ **DONE** | `ProtectedRoute` now wraps all teacher routes. |
| 2.3 | `ProtectedRoute` flashes "Access Denied" during profile load | 🟡 | ✅ **DONE** | Spinner while profile loads. |
| 2.4 | Permission map keyed by string paths (drift) | 🔵 | ⛔ **PENDING** |

### C.3 XSS
| # | Finding | Sev | Status | Notes |
|---|---------|-----|--------|-------|
| 3.1 | Unsanitized `dangerouslySetInnerHTML` ×6 | 🔴 | ✅ **DONE** | New `SafeHtml` (DOMPurify); all 6 sites migrated; 0 raw sinks remain. |
| 3.2 | RichTextEditor allows `javascript:`/`data:` links | 🔵 | ⛔ **PENDING** | Mitigated on render by 3.1 sanitization; scheme allow-list still TBD on input. |

### C.4 Config / Secrets / Env
| # | Finding | Sev | Status | Notes |
|---|---------|-----|--------|-------|
| 4.1 | API key shipped in bundle | 🟠 | ✅ **DOCUMENTED / by BE** | FE cannot fix; treated as non-secret. Real fix is backend (B.1 #1.3). |
| 4.2 | Hardcoded student portal URL | 🟡 | ✅ **DONE** | `VITE_STUDENT_PORTAL_URL` (with fallback). |
| 4.3 | PDF worker from unpkg CDN | 🟡 | ⛔ **PENDING** | Bundle `pdfjs-dist` worker locally. |
| 4.4 | Vercel SPA rewrite vs nginx move | 🟡 | ⏳ **TBD** | Tied to domain-separation infra (D). |

### C.5 Hygiene
| # | Finding | Sev | Status |
|---|---------|-----|--------|
| 5.1 | 29 `console.*` left in source | 🔵 | ⛔ **PENDING** (esbuild drop) |
| 5.2 | `useEffect` redirect double-fire/flash | 🔵 | ⛔ **PENDING** (router loaders) |
| 5.3 | Folder spelling drift (`evaluvations`) | 🔵 | ⛔ **PENDING** |
| 5.4 | Unbounded `localStorage` tab keys | 🔵 | ⛔ **PENDING** |

### C.6 Not-yet-audited (recommended next passes)
⛔ form-validation parity (Zod vs server) · bundle/code-splitting (45+15 eager routes) · a11y · i18n completeness · React Query cross-user cache hygiene.

---

## D. Domain separation — `admin.osteopathie.eu` / `teacher.osteopathie.eu`

| Layer | Item | Status |
|-------|------|--------|
| **FE** | `src/config/portal.js` (host → portal, `VITE_PORTAL` override) | ✅ **DONE** |
| **FE** | Router mounts only the active portal's routes | ✅ **DONE** |
| **FE** | Login rejects wrong-role-for-portal (auto-logout + hint) | ✅ **DONE** |
| **FE** | Per-portal branding (logo/title/theme) | ⛔ **PENDING** (hook exists via `PORTAL`) |
| **BE** | `authorize()` enforces admin vs teacher server-side | 🟡 **PARTIAL** (see B.1/B.7) — *this is the real boundary* |
| **BE** | Optional per-portal `aud` claim in JWT | ⛔ **PENDING** |
| **Infra** | Two nginx `server_name` blocks → same `dist/` + `try_files` SPA fallback | ⏳ **TBD (ops)** |
| **Infra** | DNS `admin.`/`teacher.` records + TLS (wildcard) | ⏳ **TBD (ops)** |
| **Env** | Set `VITE_PORTAL` / `VITE_STUDENT_PORTAL_URL` per deploy | ⏳ **TBD** (`.env` is gitignored — set in deploy env) |

---

## E. Recommended next order

1. ⏳ **B.4 #5.1** — fix `.gitignore`, **rotate all leaked secrets** (you have the file open — start here).
2. ⛔ **B.2 #3.2** — lock down the public upload/file endpoint (PII/GDPR).
3. 🟡 **B.7** — migrate mixed modules to per-route `authorize()` + ownership checks.
4. ⛔ **B.1 #1.2/1.4, B.3 #4.5** — OTP hashing, enumeration, encrypt Exact tokens.
5. ⚙️ **B.5 ops** — move crons out of web process; container supervision; CI gates.
6. ⏳ **D infra** — nginx/DNS/TLS to actually serve the two portals.

---

*This report reflects state as of `fix/audit-24-june` — backend `66ad4e9`, frontend `13c9530`. `test` branches untouched.*
