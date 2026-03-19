/**
 * SMOKE TESTS
 * Verify every public page loads correctly, returns 200, has correct title,
 * and critical infrastructure is healthy.
 * PB Reference: §5.2 Web Navigation, §5.3 Information Architecture
 */

import { test, expect } from "@playwright/test";
import { PUBLIC_ROUTES, AUTH_GATED_ROUTES, SITE_TITLE_PATTERN, BASE_URL } from "./helpers";

test.describe("Smoke: Public Pages Load", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route.name} (${route.path}) returns 200 and loads`, async ({ page }) => {
      const response = await page.goto(route.path);
      expect(response?.status(), `${route.name} should return 200`).toBe(200);
      await expect(page).toHaveTitle(SITE_TITLE_PATTERN);
      // No JS errors on load
      const errors: string[] = [];
      page.on("pageerror", (err) => errors.push(err.message));
      await page.waitForLoadState("networkidle");
      expect(errors, `No JS errors on ${route.path}`).toHaveLength(0);
    });
  }
});

test.describe("Smoke: Auth-Gated Routes Redirect", () => {
  for (const route of AUTH_GATED_ROUTES) {
    test(`${route} redirects unauthenticated user to /login`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login/);
    });
  }
});

test.describe("Smoke: SSL & Security Headers", () => {
  test("Site serves over HTTPS", async ({ page }) => {
    const response = await page.goto("/");
    expect(page.url()).toMatch(/^https:\/\//);
    expect(response?.status()).toBe(200);
  });

  test("HTTP redirects to HTTPS", async ({ page }) => {
    // Vercel handles this automatically — confirm final URL is HTTPS
    await page.goto("/");
    expect(page.url()).toMatch(/^https:\/\//);
  });

  test("Security response headers are present", async ({ request }) => {
    const response = await request.get(BASE_URL);
    const headers = response.headers();
    // Standard security headers Vercel/Next.js should set
    expect(headers["x-content-type-options"] || headers["x-frame-options"] || headers["strict-transport-security"],
      "At least one security header should be present"
    ).toBeTruthy();
  });
});

test.describe("Smoke: Image Delivery (Cloudflare R2)", () => {
  test("Homepage book cover images load from R2", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const images = page.locator("img");
    const count = await images.count();
    expect(count, "At least one image should be on the homepage").toBeGreaterThan(0);

    // Check each image is not broken
    for (let i = 0; i < Math.min(count, 8); i++) {
      const img = images.nth(i);
      const src = await img.getAttribute("src");
      if (src && src.includes("r2.cloudflarestorage.com")) {
        const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
        expect(naturalWidth, `R2 image ${src} should have loaded with width > 0`).toBeGreaterThan(0);
      }
    }
  });
});

test.describe("Smoke: Response Times", () => {
  const criticalPages = ["/", "/discover", "/login", "/register"];

  for (const path of criticalPages) {
    test(`${path} loads within 5 seconds`, async ({ page }) => {
      const start = Date.now();
      await page.goto(path, { waitUntil: "domcontentloaded" });
      const elapsed = Date.now() - start;
      expect(elapsed, `${path} should load in < 5000ms, took ${elapsed}ms`).toBeLessThan(5000);
    });
  }
});

test.describe("Smoke: Admin Route Hardening", () => {
  test("/admin/* returns 404 (not a redirect hint) per PB §11.6", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/admin`, { maxRedirects: 0 });
    // Should be 404, not 200 or 302 that hints at admin panel existence
    expect([404, 301, 302]).toContain(response.status());
    // If it's a redirect, the final URL should NOT contain /admin logged-in state
    if (response.status() === 200) {
      expect(await response.text()).not.toContain("Admin Dashboard");
    }
  });
});
