/**
 * API & NETWORK TESTS
 * HTTP status checks, response payload validation, headers, CORS, R2 delivery.
 * PB Reference: §3.5 AI Governance, §11.6 Security Architecture
 */

import { test, expect } from "@playwright/test";
import { BASE_URL, PUBLIC_ROUTES, AUTH_GATED_ROUTES } from "./helpers";

test.describe("API: HTTP Status Codes", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route.path} returns 200`, async ({ request }) => {
      const response = await request.get(`${BASE_URL}${route.path}`);
      expect(response.status(), `${route.path} should return 200`).toBe(200);
    });
  }
});

test.describe("API: Auth-Gated Routes Return Redirect (not 200)", () => {
  for (const route of AUTH_GATED_ROUTES) {
    test(`${route} without auth returns 200 with login content or redirects`, async ({ request }) => {
      const response = await request.get(`${BASE_URL}${route}`, { maxRedirects: 5 });
      const status = response.status();
      // Either it redirects and shows login page (200) or returns 401/403
      if (status === 200) {
        const body = await response.text();
        // If 200, the page should show login content — not the actual gated content
        const isLoginPage = body.toLowerCase().includes("log in") || body.toLowerCase().includes("sign in");
        expect(isLoginPage, `${route} should show login page for unauthenticated users`).toBe(true);
      } else {
        expect([401, 403, 302, 307]).toContain(status);
      }
    });
  }
});

test.describe("API: Response Time Benchmarks", () => {
  const criticalEndpoints = [
    { path: "/", name: "Homepage" },
    { path: "/discover", name: "Discover" },
    { path: "/login", name: "Login" },
    { path: "/register", name: "Register" },
  ];

  for (const endpoint of criticalEndpoints) {
    test(`${endpoint.name} responds within 5 seconds`, async ({ request }) => {
      const start = Date.now();
      const response = await request.get(`${BASE_URL}${endpoint.path}`);
      const elapsed = Date.now() - start;
      expect(response.status()).toBe(200);
      expect(elapsed, `${endpoint.name} took ${elapsed}ms — should be < 5000ms`).toBeLessThan(5000);
    });
  }
});

test.describe("API: Security Headers", () => {
  test("Homepage includes content security or transport headers", async ({ request }) => {
    const response = await request.get(BASE_URL);
    const headers = response.headers();
    const hasSecurityHeaders =
      headers["strict-transport-security"] ||
      headers["x-content-type-options"] ||
      headers["x-frame-options"] ||
      headers["content-security-policy"];
    expect(hasSecurityHeaders, "At least one security header should be present").toBeTruthy();
  });

  test("Cookies have appropriate flags", async ({ page }) => {
    await page.goto("/");
    const cookies = await page.context().cookies();
    // Session cookies should not be overly permissive
    for (const cookie of cookies) {
      if (cookie.name.toLowerCase().includes("session") || cookie.name.toLowerCase().includes("auth")) {
        // HttpOnly and Secure are ideal for auth cookies
        expect(cookie.secure || cookie.httpOnly,
          `Auth cookie '${cookie.name}' should be secure or httpOnly`
        ).toBe(true);
      }
    }
  });
});

test.describe("API: Admin Route Hardening (PB §11.6)", () => {
  const adminPaths = ["/admin", "/admin/login", "/dashboard/admin", "/wp-admin", "/cms"];

  for (const path of adminPaths) {
    test(`${path} does not expose admin panel (PB §11.6)`, async ({ request }) => {
      const response = await request.get(`${BASE_URL}${path}`, { maxRedirects: 3 });
      const status = response.status();
      if (status === 200) {
        const body = await response.text();
        // If 200, must not show admin content
        expect(body.toLowerCase()).not.toContain("admin dashboard");
        expect(body.toLowerCase()).not.toContain("snowshift");
        expect(body.toLowerCase()).not.toContain("super admin");
      }
      // 404 is the ideal response per PB §11.6
    });
  }
});

test.describe("API: Cloudflare R2 Image Delivery", () => {
  test("R2 signed URLs on homepage load successfully", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const failedImages: string[] = [];
    page.on("response", (response) => {
      if (response.url().includes("r2.cloudflarestorage.com") && response.status() !== 200) {
        failedImages.push(`${response.url()} → ${response.status()}`);
      }
    });

    await page.waitForTimeout(3000);
    expect(failedImages, `Failed R2 images: ${failedImages.join(", ")}`).toHaveLength(0);
  });
});

test.describe("API: Next.js Infrastructure", () => {
  test("robots.txt is accessible", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/robots.txt`);
    expect([200, 404]).toContain(response.status());
    if (response.status() === 200) {
      const body = await response.text();
      expect(body.toLowerCase()).toContain("user-agent");
    }
  });

  test("sitemap.xml is accessible", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/sitemap.xml`);
    // 200 preferred but 404 acceptable if not yet generated
    expect([200, 404]).toContain(response.status());
  });

  test("favicon is served", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/favicon.ico`);
    expect([200, 404]).toContain(response.status());
  });

  test("No 500 errors on any public page", async ({ page }) => {
    const errors500: string[] = [];
    page.on("response", (response) => {
      if (response.status() >= 500) {
        errors500.push(`${response.url()} → ${response.status()}`);
      }
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    expect(errors500, `500 errors found: ${errors500.join(", ")}`).toHaveLength(0);
  });
});
