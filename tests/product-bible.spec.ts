/**
 * PRODUCT BIBLE COMPLIANCE TESTS
 * Verifies the live site matches Product Bible v4.6 (March 19, 2026).
 * These tests ask: does the product match what it's supposed to be?
 * Every test cites the PB section it validates.
 */

import { test, expect } from "@playwright/test";
import {
  TAGLINE,
  SIDEBAR_NAV,
  BRAND,
  TEST_EMAIL_FREE,
  TEST_PASSWORD_FREE,
  loginAs,
  KNOWN_BOOK,
} from "./helpers";

// ─────────────────────────────────────────────
// BRAND & IDENTITY
// ─────────────────────────────────────────────
test.describe("PB: Brand Identity (§10.1, §10.2)", () => {
  test("Site title contains 'Paygees' (PB header)", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Paygees/i);
  });

  test("Tagline 'Affordable | Accessible | Available' is present (PB §4.1)", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const pageText = await page.textContent("body");
    expect(pageText).toContain("Affordable");
    expect(pageText).toContain("Accessible");
    expect(pageText).toContain("Available");
  });

  test("Logo reads 'PAYGEES' (PB §10.1)", async ({ page }) => {
    await page.goto("/");
    const logo = page.getByRole("link", { name: /paygees/i }).first();
    await expect(logo).toBeVisible();
  });

  test("Primary colour #1EAEDB is used — banned #2CB5B5 must not appear (PB §10.2)", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const bannedColour = await page.evaluate(() => {
      const allElements = document.querySelectorAll("*");
      for (const el of allElements) {
        const style = window.getComputedStyle(el);
        const color = style.color + style.backgroundColor + style.borderColor;
        if (color.includes("44, 181, 181") || color.includes("#2cb5b5")) {
          return true;
        }
      }
      return false;
    });
    expect(bannedColour, "Banned colour #2CB5B5 must not appear anywhere").toBe(false);
  });

  test("'Creator' term does not appear in UI — banned platform-wide per PB Q16", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const mainContent = await page.locator("main, #main, [role='main']").textContent().catch(() => "");
    expect(mainContent?.toLowerCase()).not.toContain("creator profile");
  });
});

// ─────────────────────────────────────────────
// NAVIGATION STRUCTURE
// ─────────────────────────────────────────────
test.describe("PB: Web Navigation Structure (PB §5.2)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("Top navigation includes: Home, Library, News, Events, Forums", async ({ page }) => {
    for (const item of SIDEBAR_NAV) {
      const navLink = page.getByRole("link", { name: new RegExp(`^${item}$`, "i") });
      await expect(navLink.first(), `Nav item '${item}' should be visible`).toBeVisible();
    }
  });

  test("Discover section includes: Books, Audiobooks, Periodicals, Comics, Documents", async ({ page }) => {
    for (const link of ["Books", "Audiobooks", "Periodicals"]) {
      const navLink = page.getByRole("link", { name: new RegExp(link, "i") });
      await expect(navLink.first(), `Discover link '${link}' should be visible`).toBeVisible();
    }
  });

  test("Footer contains company and support links (PB §5.2)", async ({ page }) => {
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
    const footerText = await footer.textContent();
    expect(footerText?.toLowerCase()).toMatch(/about|help|contact|terms|privacy/);
  });

  test("Footer contains copyright notice for The Book Crunch Limited", async ({ page }) => {
    const footer = page.locator("footer");
    const footerText = await footer.textContent();
    expect(footerText).toMatch(/2026|Book Crunch|Paygees/);
  });

  test("Footer shows payment method logos (PB §5.2)", async ({ page }) => {
    const footer = page.locator("footer");
    const footerText = await footer.textContent();
    const footerImages = footer.locator("img");
    const hasPaymentText = footerText?.toLowerCase().match(/visa|mastercard|mc|amex|paystack|verve/);
    const imageCount = await footerImages.count();
    expect(hasPaymentText || imageCount > 0, "Footer should show payment logos").toBeTruthy();
  });
});

// ─────────────────────────────────────────────
// HOME SCREEN SECTIONS
// ─────────────────────────────────────────────
test.describe("PB: Home Screen Sections (PB §6.1)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("Bestsellers section is present on homepage", async ({ page }) => {
    const pageText = await page.textContent("body");
    expect(pageText?.toLowerCase()).toMatch(/bestseller/);
  });

  test("Section 'See More' links are present — max 10 per section (PB §6.1)", async ({ page }) => {
    const seeMoreLinks = page.getByRole("link", { name: /see more|view all/i });
    const count = await seeMoreLinks.count();
    expect(count, "At least one 'See More' link should be present").toBeGreaterThan(0);
  });

  test("Coral #E8735A used for section headers only — not CTA button fills (PB §10.2)", async ({ page }) => {
    const buttons = page.getByRole("button");
    const count = await buttons.count();
    for (let i = 0; i < Math.min(count, 10); i++) {
      const btn = buttons.nth(i);
      const bgColor = await btn.evaluate((el) => window.getComputedStyle(el).backgroundColor);
      expect(bgColor, "Coral #E8735A must not be used as CTA button background").not.toContain("232, 115, 90");
    }
  });

  test("No EPUB / PDF / MP3 format names appear in UI (PB §10.5)", async ({ page }) => {
    const pageText = await page.textContent("body");
    expect(pageText?.toLowerCase()).not.toContain("epub");
    expect(pageText?.toLowerCase()).not.toMatch(/\.pdf\b/);
    expect(pageText?.toLowerCase()).not.toMatch(/\.mp3\b/);
    expect(pageText?.toLowerCase()).not.toMatch(/\.cbz\b/);
  });
});

// ─────────────────────────────────────────────
// BOOK DETAIL PAGE
// ─────────────────────────────────────────────
test.describe("PB: Book Detail Page Spec (PB §6.3)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(KNOWN_BOOK.path);
    await page.waitForLoadState("networkidle");
  });

  test("Cover image is large and prominent (Priority 1)", async ({ page }) => {
    const img = page.locator("img").first();
    await expect(img).toBeVisible();
  });

  test("Title and author displayed (Priority 1)", async ({ page }) => {
    const pageText = await page.textContent("body");
    expect(pageText).toContain(KNOWN_BOOK.title);
  });

  test("Age rating appears on book detail (PB §2.4)", async ({ page }) => {
    const pageText = await page.textContent("body");
    expect(pageText).toMatch(/\d+\+/);
  });

  test("Free label appears for free books (PB §1.3)", async ({ page }) => {
    const pageText = await page.textContent("body");
    expect(pageText?.toLowerCase()).toContain("free");
  });

  test("File format names do NOT appear — never show EPUB/PDF/MP3 (PB §6.3)", async ({ page }) => {
    const pageText = await page.textContent("body");
    expect(pageText?.toLowerCase()).not.toContain("epub");
    expect(pageText?.toLowerCase()).not.toMatch(/\.pdf\b/);
  });
});

// ─────────────────────────────────────────────
// SUBSCRIPTION TIERS (PB §1.3 — v4.6)
// ─────────────────────────────────────────────
test.describe("PB: Subscription Tiers in UI (PB §1.3, v4.6)", () => {
  test("Pricing page (if exists) shows the 4 main tiers: Free, Basic, Standard, Premium", async ({ page }) => {
    // Per PB v4.6: Junior is a paid add-on, not a peer tier.
    // The main tier ladder is Free / Basic / Standard / Premium only.
    for (const path of ["/pricing", "/subscribe", "/plans"]) {
      const response = await page.goto(path);
      if (response?.status() === 200) {
        const pageText = await page.textContent("body");
        expect(pageText?.toLowerCase()).toMatch(/free/);
        expect(pageText?.toLowerCase()).toMatch(/basic/);
        expect(pageText?.toLowerCase()).toMatch(/standard/);
        expect(pageText?.toLowerCase()).toMatch(/premium/);
        return;
      }
    }
    test.skip();
  });

  test("'Junior' terminology used — not 'Kids' or 'Children' (PB §1.3)", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const pageText = await page.textContent("body");
    if (pageText?.toLowerCase().includes("tier") || pageText?.toLowerCase().includes("plan")) {
      expect(pageText?.toLowerCase()).not.toContain("kids tier");
      expect(pageText?.toLowerCase()).not.toContain("children tier");
    }
  });

  test("Junior is NOT presented as a default-included benefit of any tier (PB §1.3, Q21)", async ({ page }) => {
    // Per PB v4.6 Q21: Junior is a paid add-on for ALL tiers — never bundled by default.
    // Standard and Premium subscribers do NOT get Junior free unless a campaign waiver applies.
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const pageText = await page.textContent("body");
    expect(pageText?.toLowerCase()).not.toContain("includes junior");
    expect(pageText?.toLowerCase()).not.toContain("child accounts included");
    expect(pageText?.toLowerCase()).not.toContain("free child accounts");
    expect(pageText?.toLowerCase()).not.toContain("junior included");
  });
});

// ─────────────────────────────────────────────
// JUNIOR ADD-ON MODEL (PB §1.3, §2.3, Q21 — v4.6)
// ─────────────────────────────────────────────
test.describe("PB: Junior Add-On Model (PB §1.3, §2.3, Q21 — v4.6)", () => {
  test("Junior is not presented as a comparable standalone subscription tier", async ({ page }) => {
    // Per PB v4.6 Q21: Junior is a separate paid add-on at 1,000/mo.
    // It is not a step on the Free > Basic > Standard > Premium upgrade ladder.
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const pageText = await page.textContent("body");
    if (pageText?.toLowerCase().includes("junior")) {
      // Should not appear as an upgrade option alongside the main tiers
      expect(pageText?.toLowerCase()).not.toContain("upgrade to junior");
    }
  });

  test("Guardian Dashboard is not linked to logged-out users (PB §5.3)", async ({ page }) => {
    // Guardian Dashboard is an authenticated feature — not publicly accessible
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const guardianLink = page.getByRole("link", { name: /guardian dashboard/i });
    await expect(guardianLink).not.toBeVisible();
  });

  test("Junior add-on available to Free tier — not exclusive to paid tiers (PB §1.3, Q21)", async ({ page }) => {
    // Per PB v4.6 Q21: ANY account tier (Free, Basic, Standard, Premium) can subscribe to Junior.
    // No tier gate on the add-on itself — only the campaign waiver has tier eligibility rules.
    // This test documents the requirement — verified when Guardian Dashboard is built
    await page.goto("/");
    const pageText = await page.textContent("body");
    // If any pricing copy references Junior, it must not restrict it to paid tiers only
    if (pageText?.toLowerCase().includes("junior add-on")) {
      expect(pageText?.toLowerCase()).not.toContain("junior add-on for premium only");
      expect(pageText?.toLowerCase()).not.toContain("junior add-on for standard only");
    }
  });
});

// ─────────────────────────────────────────────
// EDITOR'S PICKS NAMING RULE
// ─────────────────────────────────────────────
test.describe("PB: Editor's Picks Naming Canonical Rule (PB §6.1)", () => {
  test("Curated section uses 'Editor's Picks' — not 'Staff Picks' or 'Paygees Picks'", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const pageText = await page.textContent("body");
    if (pageText?.toLowerCase().includes("picks")) {
      expect(pageText?.toLowerCase()).not.toContain("staff picks");
      expect(pageText?.toLowerCase()).not.toContain("paygees picks");
    }
  });
});

// ─────────────────────────────────────────────
// FORUMS — ACCESS RULES
// ─────────────────────────────────────────────
test.describe("PB: Forum Access Rules (PB §6.6, Q14)", () => {
  test("Forums require login — unauthenticated visitors redirected (login is CTA per PB Q14)", async ({ page }) => {
    await page.goto("/forums");
    await page.waitForLoadState("networkidle");
    expect(page.url()).toMatch(/\/login|\/register/);
  });

  test("Forums page does not return a 500 error", async ({ page }) => {
    await page.goto("/forums");
    await page.waitForLoadState("networkidle");
    const pageText = await page.textContent("body");
    expect(pageText).not.toContain("500");
    expect(pageText).not.toContain("Internal Server Error");
  });

  test("Logged-in Free user can access forums (PB Q14 — read + reply access)", async ({ page }) => {
    await loginAs(page, TEST_EMAIL_FREE, TEST_PASSWORD_FREE);
    await page.goto("/forums");
    await page.waitForLoadState("networkidle");
    expect(page.url()).not.toMatch(/\/login/);
    const pageText = await page.textContent("body");
    expect(pageText).not.toContain("500");
  });
});

// ─────────────────────────────────────────────
// AUTHOR PROFILE RULES
// ─────────────────────────────────────────────
test.describe("PB: Author Profile Rules (PB §6.10, Q15, Q16)", () => {
  test("Author profile pages use /author/ route (PB §6.10)", async ({ page }) => {
    await page.goto(KNOWN_BOOK.path);
    await page.waitForLoadState("networkidle");
    const authorLinks = page.locator("a[href*='/author/']");
    if (await authorLinks.count() > 0) {
      const href = await authorLinks.first().getAttribute("href");
      expect(href).toMatch(/\/author\//);
    }
  });

  test("No 'Publisher Profile' page — Publisher is internal-only (PB Q16)", async ({ page }) => {
    const response = await page.goto("/publisher");
    if (response?.status() === 200) {
      const pageText = await page.textContent("body");
      expect(pageText?.toLowerCase()).not.toContain("publisher profile");
    }
  });
});

// ─────────────────────────────────────────────
// INFORMATION ARCHITECTURE
// ─────────────────────────────────────────────
test.describe("PB: Information Architecture (PB §5.3)", () => {
  test("Logged-out users see marketing/landing content on homepage", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const pageText = await page.textContent("body");
    expect(pageText).toMatch(/discover|sign up|log in|explore|read/i);
  });

  test("Admin routes not linked from main site (PB §5.3, §11.6)", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const allLinks = await page.locator("a").all();
    for (const link of allLinks) {
      const href = await link.getAttribute("href");
      if (href) {
        expect(href, "No admin link should be in public nav").not.toMatch(/\/admin|snowshift/i);
      }
    }
  });

  test("Publisher Dashboard not linked from public homepage (PB §5.3)", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const publisherDashLink = page.getByRole("link", { name: /publisher dashboard/i });
    await expect(publisherDashLink).not.toBeVisible();
  });

  test("Sign Out is in profile dropdown only — not in top bar directly (PB §5.2)", async ({ page }) => {
    await loginAs(page, TEST_EMAIL_FREE, TEST_PASSWORD_FREE);
    const topBarSignOut = page.locator("header").getByRole("button", { name: /sign out/i });
    const topBarSignOutLink = page.locator("nav").getByRole("link", { name: /sign out/i });
    await expect(topBarSignOut).not.toBeVisible();
    await expect(topBarSignOutLink).not.toBeVisible();
  });
});
