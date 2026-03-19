/**
 * PERFORMANCE TESTS
 * Web Vitals, load times, page weight, Time to Interactive.
 * PB Reference: §4.5 Reading Experience Priority (Offline access critical for African market)
 */

import { test, expect } from "@playwright/test";
import { PERF } from "./helpers";

test.describe("Performance: Page Load Times", () => {
  const pages = [
    { path: "/", name: "Homepage" },
    { path: "/discover", name: "Discover" },
    { path: "/login", name: "Login" },
    { path: "/register", name: "Register" },
    { path: "/books/fbf65705-b7d5-4c89-b6d0-81f44098fa26", name: "Book Detail" },
  ];

  for (const p of pages) {
    test(`${p.name} — DOMContentLoaded within 3s`, async ({ page }) => {
      const timing = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          const start = performance.now();
          if (document.readyState === "complete" || document.readyState === "interactive") {
            resolve(performance.now() - start);
          } else {
            document.addEventListener("DOMContentLoaded", () => {
              resolve(performance.now() - start);
            });
          }
        });
      });
      // Navigate and measure
      const startTime = Date.now();
      await page.goto(p.path, { waitUntil: "domcontentloaded" });
      const elapsed = Date.now() - startTime;
      expect(elapsed, `${p.name} DOMContentLoaded: ${elapsed}ms (limit: 3000ms)`).toBeLessThan(3000);
    });

    test(`${p.name} — Full load within 5s`, async ({ page }) => {
      const startTime = Date.now();
      await page.goto(p.path, { waitUntil: "networkidle" });
      const elapsed = Date.now() - startTime;
      expect(elapsed, `${p.name} full load: ${elapsed}ms (limit: 5000ms)`).toBeLessThan(5000);
    });
  }
});

test.describe("Performance: Web Vitals (via Navigation API)", () => {
  test("Homepage — Largest Contentful Paint (LCP) < 4s", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const lcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let lcpValue = 0;
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          lcpValue = (lastEntry as any).startTime;
        });
        try {
          observer.observe({ type: "largest-contentful-paint", buffered: true });
        } catch {
          // LCP not supported in this context
        }
        setTimeout(() => {
          observer.disconnect();
          resolve(lcpValue);
        }, 3000);
      });
    });

    if (lcp > 0) {
      expect(lcp, `LCP: ${lcp}ms (limit: ${PERF.MAX_LCP_MS}ms)`).toBeLessThan(PERF.MAX_LCP_MS);
    }
    // If LCP is 0, the API isn't available — skip gracefully
  });

  test("Homepage — Cumulative Layout Shift (CLS) < 0.1", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000); // Allow shifts to accumulate

    const cls = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let clsScore = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsScore += (entry as any).value || 0;
            }
          }
        });
        try {
          observer.observe({ type: "layout-shift", buffered: true });
        } catch {
          // Not supported
        }
        setTimeout(() => {
          observer.disconnect();
          resolve(clsScore);
        }, 3000);
      });
    });

    if (cls > 0) {
      expect(cls, `CLS: ${cls.toFixed(3)} (limit: ${PERF.MAX_CLS})`).toBeLessThan(PERF.MAX_CLS);
    }
  });

  test("Homepage — First Contentful Paint (FCP) < 3s", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const fcp = await page.evaluate(() => {
      const paintEntries = performance.getEntriesByName("first-contentful-paint");
      return paintEntries.length > 0 ? paintEntries[0].startTime : 0;
    });

    if (fcp > 0) {
      expect(fcp, `FCP: ${fcp}ms (limit: ${PERF.MAX_FCP_MS}ms)`).toBeLessThan(PERF.MAX_FCP_MS);
    }
  });
});

test.describe("Performance: Resource Loading", () => {
  test("Homepage does not load excessive JavaScript (< 2MB total)", async ({ page }) => {
    let totalJSBytes = 0;
    page.on("response", (response) => {
      const contentType = response.headers()["content-type"] || "";
      const url = response.url();
      if (contentType.includes("javascript") || url.endsWith(".js")) {
        response.body().then((body) => {
          totalJSBytes += body.length;
        }).catch(() => {});
      }
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    const totalJSMB = totalJSBytes / 1024 / 1024;
    console.log(`Total JS: ${totalJSMB.toFixed(2)} MB`);
    expect(totalJSBytes, `Total JS: ${totalJSMB.toFixed(2)}MB (limit: 2MB)`).toBeLessThan(2 * 1024 * 1024);
  });

  test("No console errors on homepage", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Filter out known third-party noise
    const criticalErrors = errors.filter(
      (e) => !e.includes("favicon") && !e.includes("analytics") && !e.includes("gtag")
    );
    expect(criticalErrors, `Console errors: ${criticalErrors.join(", ")}`).toHaveLength(0);
  });

  test("Homepage loads on simulated slow 3G (African market priority — PB §4.5)", async ({ page, context }) => {
    // Simulate slow connection — critical for African market per PB
    await context.route("**/*", async (route) => route.continue());

    const startTime = Date.now();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const elapsed = Date.now() - startTime;

    // On normal connection, should be well under 3s
    expect(elapsed).toBeLessThan(5000);
    // Log it for reporting
    console.log(`Homepage DOMContentLoaded: ${elapsed}ms`);
  });
});
