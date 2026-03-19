# Paygees Production Test Suite

**Target:** https://paygees-web.vercel.app  
**Product Bible:** v4.5 (March 16, 2026)  
**Framework:** Playwright + Allure Reports + GitHub Actions  
**Scope:** Read-only. Zero writes to your database. Zero interference with Claude Code or the Paygees codebase.

---

## What This Does

This is a standalone test repository that acts like a robot user visiting your live site 24/7. It tests, documents, and reports — but never modifies anything.

### Test Suites

| File | Type | What It Tests | PB Reference |
|------|------|---------------|--------------|
| `smoke.spec.ts` | Smoke | All 19 public pages load, SSL, R2 images, response times | §5.2, §5.3 |
| `auth.spec.ts` | User Flow | Login, Register, Forgot Password, session behaviour | §2.2, §4.7 |
| `browse.spec.ts` | User Flow | Homepage sections, Discover, Book Detail, Library, Forums | §6.1–6.3, §6.8 |
| `product-bible.spec.ts` | PB Compliance | Brand, navigation, naming rules, copy, architecture | All of PB v4.5 |
| `api.spec.ts` | API/Network | HTTP status, auth-gating, response times, R2 delivery, security headers | §11.5, §11.6 |
| `visual.spec.ts` | Visual Regression | Screenshot diffs across desktop/tablet/mobile viewports | §10.2, §10.4 |
| `accessibility.spec.ts` | Accessibility | WCAG 2.1 AA, keyboard nav, semantic HTML, alt text | §4.3 |
| `performance.spec.ts` | Performance | LCP, FCP, CLS, load times, JS bundle size | §4.5 |
| `security.spec.ts` | Security | Auth protection, open redirects, XSS, admin hardening | §11.5, §11.6 |
| `seo.spec.ts` | SEO | Meta tags, OG tags, canonical URLs, robots.txt | §4.1 |

---

## Setup (One-Time, ~5 Minutes)

### Prerequisites

- Node.js 18+ installed
- A GitHub account
- This repo pushed to GitHub

### Step 1 — Install

```bash
npm install
npx playwright install
```

### Step 2 — Create a GitHub Repository

```bash
git init
git remote add origin https://github.com/YOUR_USERNAME/paygees-tests.git
git add .
git commit -m "Initial test suite — Paygees v4.5"
git push -u origin main
```

### Step 3 — Add GitHub Secrets

Go to your repo → **Settings → Secrets and variables → Actions → New repository secret**

| Secret | Value |
|--------|-------|
| `TEST_EMAIL` | `test@paygees.com` |
| `TEST_PASSWORD` | `Duckie90!@gmail.com` |
| `NOTIFY_EMAIL_USER` | Your Gmail address |
| `NOTIFY_EMAIL_PASS` | Gmail App Password (not regular password) |
| `NOTIFY_EMAIL_TO` | Email where failure alerts go |
| `SLACK_WEBHOOK_URL` | (Optional) Slack webhook for failure alerts |

> **Gmail App Password:** Go to myaccount.google.com → Security → 2-Step Verification → App passwords → Generate one for "Mail".

### Step 4 — Enable GitHub Pages (for the report dashboard)

1. Go to your repo → **Settings → Pages**
2. Source: **Deploy from a branch**
3. Branch: **gh-pages** / **root**
4. Your dashboard will be at: `https://YOUR_USERNAME.github.io/paygees-tests/allure-report`

### Step 5 — Connect Vercel Deploy Hook (optional)

See `vercel-webhook-setup.ts` for full instructions.  
Short version: create a GitHub Personal Access Token, then configure a Vercel post-deployment webhook to POST to the GitHub repository_dispatch API. Tests will automatically run after every Vercel deployment.

---

## Running Tests Locally

```bash
# All tests
npm test

# Individual suites
npm run test:smoke
npm run test:auth
npm run test:browse
npm run test:bible          # Product Bible compliance
npm run test:visual
npm run test:api
npm run test:accessibility
npm run test:performance
npm run test:security
npm run test:seo

# Mobile only
npm run test:mobile

# View report after running
npm run report
```

### Updating Visual Baselines

When you intentionally change the UI and want to update screenshots:

```bash
npx playwright test tests/visual.spec.ts --update-snapshots
git add tests/
git commit -m "Update visual baselines — [describe what changed]"
```

---

## How Tests Are Triggered

| Trigger | When |
|---------|------|
| **Scheduled** | Every hour, automatically, 24/7 |
| **After deployment** | Vercel deploy hook → runs within minutes of each deploy |
| **Manual** | GitHub → Actions → "Paygees Production Tests" → Run workflow |
| **On push** | When you push changes to `tests/` in this repo |

---

## Where Reports Go

| Report | Location | Details |
|--------|----------|---------|
| **Allure Dashboard** | `https://YOUR_USERNAME.github.io/paygees-tests/allure-report` | Full history, charts, screenshots, video replays — permanent URL |
| **GitHub Actions Summary** | GitHub → Actions → latest run → Summary | Pass/fail table per suite, link to Allure |
| **Email Alert** | Your inbox | Only sent on failure — includes which suite failed and link to full report |
| **Slack** | Your channel (optional) | Same as email, in a Slack message |

---

## Separation from Claude Code & Paygees Codebase

This test suite is **completely isolated** from your development work:

- It lives in its **own GitHub repository** — separate from `paygees-web`
- It **only makes HTTP requests** to the live site — same as any browser visitor
- It has **zero write access** to your database, Vercel project, or source code
- Claude Code operates on your local machine; this suite runs on **GitHub's cloud servers**
- Deleting this entire repo would have **zero effect** on Paygees whatsoever
- The only connection: a Vercel deploy webhook sends a signal (one-way) to start tests after deploys

---

## Product Bible Compliance Tests

The `product-bible.spec.ts` file is the most important suite. Each test is annotated with the PB section it validates. Key checks include:

- ✅ Tagline is exactly "Affordable | Accessible | Available" (PB header)
- ✅ Primary colour `#1EAEDB` is used — banned colour `#2CB5B5` never appears (§10.2)
- ✅ Coral `#E8735A` used for section headers only — not CTA button fills (§10.2)
- ✅ Section headers use "Editor's Picks" — not "Staff Picks" or "Paygees Picks" (§6.1)
- ✅ "Creator" terminology does not appear anywhere (Q16 — banned platform-wide)
- ✅ File format names (EPUB, PDF, MP3) never shown in UI (§6.3, §10.5)
- ✅ Sign Out only in profile dropdown — not in top bar directly (§5.2)
- ✅ Publisher Dashboard not linked from public homepage (§5.3)
- ✅ Admin routes not linked from main site (§5.3, §11.6)
- ✅ Author profile uses `/author/` route (§6.10)
- ✅ Age ratings appear on book detail pages (§2.4)
- ✅ "See More" links present with max 10 items per section (§6.1)
- ✅ Library tabs: In Progress, Favorites, Finished, All My Books (§6.2)
- ✅ Card details never exposed in any page (§11.5)

---

## Adding New Tests

When you build new features, add tests to the appropriate file:

```typescript
// In product-bible.spec.ts
test("Guardian Dashboard accessible from Profile (PB §6.11)", async ({ page }) => {
  // ... login, navigate to profile, check for Guardian link
});

// In browse.spec.ts
test("Age-13 transition message matches PB copy (PB §2.5)", async ({ page }) => {
  // Check the exact copy: "Your Paygees account just grew up!"
});
```

---

## Test Credentials

Stored as GitHub Secrets — never hardcoded in committed code.

- `TEST_EMAIL`: `test@paygees.com`
- `TEST_PASSWORD`: stored in GitHub Secrets as `TEST_PASSWORD`

To rotate: update the GitHub Secret. No code changes needed.

---

*Paygees Production Test Suite — The Book Crunch Limited*
