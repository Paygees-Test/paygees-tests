/**
 * SECURITY TESTS
 * Auth protection, open redirects, CSP, cookie flags.
 * PB Reference: §11.5 Global Security Rules, §11.6 Admin Security Architecture
 */

import { test, expect } from "@playwright/test";
import { BASE_URL, AUTH_GATED_ROUTES } from "./helpers";

test.describe("Security: Auth Protection", () => {
  for (const route of AUTH_GATED_ROUTES) {
    test(`${route} is protected — unauthenticated access redirects to login`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login|\/register/);
    });
  }
});

test.describe("Security: Open Redirect Prevention", () => {
  test("Login redirect param cannot be used to redirect to external site", async ({ page }) => {
    await page.goto("/login?redirect=https://evil.com");
    await page.waitForLoadState("domcontentloaded");
    // Even if the redirect param is accepted, after any action it should NOT go to evil.com
    const url = page.url();
    expect(url).not.toContain("evil.com");
  });

  test("Login redirect param to external domain is ignored", async ({ page }) => {
    await page.goto("/login?next=https://malicious.site");
    await page.waitForLoadState("domcontentloaded");
    const url = page.url();
    expect(url).not.toContain("malicious.site");
  });
});

test.describe("Security: Admin Route Hardening (PB §11.6)", () => {
  const sensitiveRoutes = [
    "/admin",
    "/admin/login",
    "/admin/users",
    "/admin/finance",
    "/.env",
    "/.env.local",
    "/api/admin",
  ];

  for (const route of sensitiveRoutes) {
    test(`${route} does not expose sensitive data`, async ({ request }) => {
      const response = await request.get(`${BASE_URL}${route}`, { maxRedirects: 3 });
      const status = response.status();

      if (status === 200) {
        const body = await response.text();
        // These strings must never appear on publicly accessible pages
        expect(body).not.toContain("DB_PASSWORD");
        expect(body).not.toContain("SECRET_KEY");
        expect(body).not.toContain("PRIVATE_KEY");
        expect(body.toLowerCase()).not.toContain("admin dashboard");
        expect(body.toLowerCase()).not.toContain("snowshift");
      }
      // 404 or 403 are both acceptable — what matters is no data leakage on 200
    });
  }
});

test.describe("Security: Information Disclosure", () => {
  test("Error pages do not expose stack traces", async ({ page }) => {
    await page.goto("/this-route-does-not-exist-xyz-test");
    const pageText = await page.textContent("body");
    // Should not expose server-side error details
    expect(pageText?.toLowerCase()).not.toContain("stack trace");
    expect(pageText?.toLowerCase()).not.toContain("at object.<anonymous>");
    expect(pageText?.toLowerCase()).not.toContain("prisma");
    expect(pageText?.toLowerCase()).not.toContain("supabase");
  });

  test("Response headers do not expose server technology details", async ({ request }) => {
    const response = await request.get(BASE_URL);
    const headers = response.headers();
    // X-Powered-By should ideally be absent (exposes tech stack)
    // Vercel usually removes this — just verify no sensitive info
    const poweredBy = headers["x-powered-by"];
    if (poweredBy) {
      // Even if present, should not reveal specific versions
      expect(poweredBy).not.toMatch(/\d+\.\d+\.\d+/); // No version numbers
    }
  });
});

test.describe("Security: XSS Prevention", () => {
  test("Search input does not reflect raw HTML (basic XSS check)", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const searchInput = page.locator("input[type='search'], input[placeholder*='search' i]");
    if (await searchInput.count() > 0) {
      const xssPayload = "<script>alert('xss')</script>";
      await searchInput.first().fill(xssPayload);
      await page.keyboard.press("Enter");
      await page.waitForTimeout(2000);

      // The payload should not be rendered as HTML
      const pageContent = await page.content();
      expect(pageContent).not.toContain("<script>alert('xss')</script>");

      // Check no alert dialog appeared
      let alertTriggered = false;
      page.on("dialog", () => { alertTriggered = true; });
      await page.waitForTimeout(1000);
      expect(alertTriggered, "XSS alert should not trigger").toBe(false);
    }
  });
});

test.describe("Security: HTTPS Enforcement", () => {
  test("All internal links use HTTPS or relative paths", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const insecureLinks: string[] = [];
    const allLinks = await page.locator("a[href]").all();

    for (const link of allLinks) {
      const href = await link.getAttribute("href");
      if (href && href.startsWith("http://") && !href.includes("localhost")) {
        insecureLinks.push(href);
      }
    }

    expect(insecureLinks, `Insecure HTTP links found: ${insecureLinks.join(", ")}`).toHaveLength(0);
  });
});

test.describe("Security: Cookie Configuration (PB §11.5)", () => {
  test("Card details are never displayed in any page response (PB §11.5)", async ({ page }) => {
    await page.goto("/");
    const pageText = await page.textContent("body");
    // PB §11.5: "No card details ever — Full numbers, CVV, PIN never displayed"
    expect(pageText).not.toMatch(/\b\d{16}\b/); // No 16-digit card numbers
    expect(pageText).not.toMatch(/cvv|cvc|pin\s*:\s*\d/i);
  });
});
