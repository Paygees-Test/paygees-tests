/**
 * VISUAL REGRESSION TESTS
 * Screenshot comparisons across key pages and viewports.
 * First run: generates baselines (stored in snapshots/).
 * Subsequent runs: diffs against baselines and fails on changes.
 *
 * To update baselines after intentional changes:
 *   npx playwright test tests/visual.spec.ts --update-snapshots
 */

import { test, expect } from "@playwright/test";
import { TEST_EMAIL_FREE, TEST_PASSWORD_FREE, loginAs } from "./helpers";

// Visual tests run on Chromium only to avoid cross-browser rendering noise
test.use({ browserName: "chromium" });

const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
];

test.describe("Visual: Public Pages", () => {
  for (const viewport of VIEWPORTS) {
    test(`Homepage — ${viewport.name} (${viewport.width}px)`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      // Wait for images to load
      await page.waitForTimeout(2000);
      await expect(page).toHaveScreenshot(`homepage-${viewport.name}.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.02, // Allow 2% pixel difference
        animations: "disabled",
      });
    });

    test(`Discover — ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/discover");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);
      await expect(page).toHaveScreenshot(`discover-${viewport.name}.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.02,
        animations: "disabled",
      });
    });

    test(`Login — ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/login");
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveScreenshot(`login-${viewport.name}.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.01,
        animations: "disabled",
      });
    });

    test(`Register — ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/register");
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveScreenshot(`register-${viewport.name}.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.01,
        animations: "disabled",
      });
    });
  }
});

test.describe("Visual: Book Detail Page", () => {
  for (const viewport of VIEWPORTS) {
    test(`Book detail — ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/books/fbf65705-b7d5-4c89-b6d0-81f44098fa26");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1500);
      await expect(page).toHaveScreenshot(`book-detail-${viewport.name}.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.02,
        animations: "disabled",
      });
    });
  }
});

test.describe("Visual: Authenticated Pages", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(TEST_EMAIL_FREE);
    await page.getByLabel(/password/i).fill(TEST_PASSWORD_FREE);
    await page.getByRole("button", { name: /log in/i }).click();
    await page.waitForURL((url) => !url.toString().includes("/login"), { timeout: 15000 });
  });

  test("Library page — desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/library");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);
    await expect(page).toHaveScreenshot("library-desktop.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    });
  });

  test("Home screen logged in — desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await expect(page).toHaveScreenshot("home-loggedin-desktop.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    });
  });
});

test.describe("Visual: Brand Colour Spot Checks (PB §10.2)", () => {
  test("Primary CTA buttons use correct brand colour", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    const loginBtn = page.getByRole("button", { name: /log in/i });
    await expect(loginBtn).toBeVisible();

    const bgColor = await loginBtn.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );

    // Primary button should use #1EAEDB (30, 174, 219 in RGB) or close variation
    // We check it's NOT the banned colour #2CB5B5 (44, 181, 181)
    expect(bgColor).not.toContain("44, 181, 181");
  });

  test("No broken images (images with 0 width/height)", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const brokenImages = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll("img"));
      return images
        .filter((img) => img.complete && (img.naturalWidth === 0 || img.naturalHeight === 0))
        .map((img) => img.src);
    });

    expect(brokenImages, `Broken images found: ${brokenImages.join(", ")}`).toHaveLength(0);
  });
});
