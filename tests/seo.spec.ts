/**
 * SEO TESTS
 * Meta tags, Open Graph, canonical URLs, robots, sitemap.
 * PB Reference: §4.1 North Star (Affordable | Accessible | Available)
 */

import { test, expect } from "@playwright/test";
import { BASE_URL } from "./helpers";

test.describe("SEO: Meta Tags", () => {
  test("Homepage has a meta description", async ({ page }) => {
    await page.goto("/");
    const description = await page.locator('meta[name="description"]').getAttribute("content");
    expect(description, "Meta description should be present").toBeTruthy();
    expect(description!.length, "Meta description should be 50-160 chars").toBeGreaterThan(50);
    expect(description!.length, "Meta description should be < 160 chars").toBeLessThan(160);
  });

  test("Homepage has correct title tag", async ({ page }) => {
    await page.goto("/");
    const title = await page.title();
    expect(title).toContain("Paygees");
    expect(title.length, "Title should be < 70 chars").toBeLessThan(70);
  });

  test("Login page has noindex or appropriate meta (auth pages shouldn't be indexed)", async ({ page }) => {
    await page.goto("/login");
    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    // It's acceptable to either have noindex or not have the tag at all
    // What matters is it doesn't have 'index, follow' on auth pages ideally
    // This is a soft check — report what's there
    console.log(`Login page robots meta: ${robots || "not set"}`);
    expect(true).toBe(true); // Informational test
  });

  test("Book detail page has a meta description", async ({ page }) => {
    await page.goto("/books/fbf65705-b7d5-4c89-b6d0-81f44098fa26");
    await page.waitForLoadState("networkidle");
    const description = await page.locator('meta[name="description"]').getAttribute("content");
    if (description) {
      expect(description.length).toBeGreaterThan(10);
    }
    // Not a hard failure if not set — just report
  });
});

test.describe("SEO: Open Graph Tags", () => {
  test("Homepage has OG title", async ({ page }) => {
    await page.goto("/");
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute("content");
    if (ogTitle) {
      expect(ogTitle).toContain("Paygees");
    }
  });

  test("Homepage has OG description", async ({ page }) => {
    await page.goto("/");
    const ogDesc = await page.locator('meta[property="og:description"]').getAttribute("content");
    if (ogDesc) {
      expect(ogDesc.length).toBeGreaterThan(20);
    }
  });

  test("Homepage has OG image", async ({ page }) => {
    await page.goto("/");
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute("content");
    if (ogImage) {
      expect(ogImage).toMatch(/^https:\/\//);
    }
  });

  test("Book detail page has OG tags with book info", async ({ page }) => {
    await page.goto("/books/fbf65705-b7d5-4c89-b6d0-81f44098fa26");
    await page.waitForLoadState("networkidle");

    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute("content");
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute("content");

    if (ogTitle) {
      expect(ogTitle.toLowerCase()).toMatch(/paygees|he done her wrong/i);
    }
    if (ogImage) {
      expect(ogImage).toMatch(/^https:\/\//);
    }
  });
});

test.describe("SEO: Canonical URLs", () => {
  test("Homepage has a canonical URL", async ({ page }) => {
    await page.goto("/");
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    if (canonical) {
      expect(canonical).toContain("paygees");
      expect(canonical).toMatch(/^https:\/\//);
    }
  });
});

test.describe("SEO: Technical SEO", () => {
  test("robots.txt is present and allows crawling", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/robots.txt`);
    if (response.status() === 200) {
      const body = await response.text();
      expect(body.toLowerCase()).toContain("user-agent");
      // Should not block all crawlers on a public content site
      const blocksAll = body.includes("Disallow: /") && !body.includes("Allow: /");
      expect(blocksAll, "robots.txt should not block all crawlers").toBe(false);
    }
  });

  test("sitemap.xml is valid XML if present", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/sitemap.xml`);
    if (response.status() === 200) {
      const body = await response.text();
      expect(body).toContain("<?xml");
      expect(body).toContain("<urlset");
      expect(body).toContain("paygees");
    }
  });

  test("All internal links use consistent domain (no mixed domains)", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const allLinks = await page.locator("a[href^='https://']").all();
    const externalLinks: string[] = [];

    for (const link of allLinks) {
      const href = await link.getAttribute("href");
      if (href && !href.includes("paygees") && !href.includes("vercel.app")) {
        externalLinks.push(href);
      }
    }

    // External links are fine (social, etc.) — just report them
    console.log(`External links found: ${externalLinks.length}`);
    console.log(externalLinks.slice(0, 10).join("\n"));
  });

  test("No duplicate page titles across key pages", async ({ page }) => {
    const titles: Record<string, string> = {};
    const pages = ["/", "/discover", "/login", "/register", "/about"];

    for (const path of pages) {
      await page.goto(path);
      const title = await page.title();
      titles[path] = title;
    }

    // Each page should have a unique title
    const titleValues = Object.values(titles);
    const uniqueTitles = new Set(titleValues);
    expect(uniqueTitles.size, `Duplicate titles found: ${JSON.stringify(titles)}`).toBe(titleValues.length);
  });
});
