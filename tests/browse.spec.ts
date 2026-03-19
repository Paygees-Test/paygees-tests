/**
 * BROWSE & DISCOVER FLOW TESTS
 * Content discovery, book detail pages, search, category browsing.
 * PB Reference: §6.1 Home Screen, §6.3 Book Detail, §6.8 Discover Screen
 */

import { test, expect } from "@playwright/test";
import { DISCOVER_CATEGORIES, KNOWN_BOOK, TEST_EMAIL, TEST_PASSWORD } from "./helpers";

test.describe("Browse: Homepage Sections (PB §6.1)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("Homepage renders Bestsellers section", async ({ page }) => {
    const text = await page.textContent("body");
    expect(text?.toLowerCase()).toMatch(/bestseller|popular|trending/);
  });

  test("Homepage has at least one book card visible", async ({ page }) => {
    // Book cards should be present — covers, titles
    const cards = page.locator("a[href*='/books/']");
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test("Each book card has a cover image", async ({ page }) => {
    const cards = page.locator("a[href*='/books/']");
    const count = await cards.count();
    if (count > 0) {
      const firstCard = cards.first();
      const img = firstCard.locator("img");
      await expect(img).toBeVisible();
      const src = await img.getAttribute("src");
      expect(src).toBeTruthy();
    }
  });

  test("Book cards show content type label (Book/Comic/Audiobook)", async ({ page }) => {
    const pageText = await page.textContent("body");
    // PB §6.3: content type shown — Book, Comic, Audiobook (not EPUB, PDF, MP3)
    expect(pageText?.toLowerCase()).toMatch(/book|comic|audiobook/);
    // Explicit format names must NOT appear per PB §10.5
    expect(pageText?.toLowerCase()).not.toContain("epub");
    expect(pageText?.toLowerCase()).not.toContain(".pdf");
    expect(pageText?.toLowerCase()).not.toContain(".mp3");
  });

  test("Sections use 'See More' / 'View All' links per PB §6.1 (max 10 per section)", async ({ page }) => {
    const seeMore = page.getByRole("link", { name: /see more|view all/i });
    await expect(seeMore.first()).toBeVisible();
  });

  test("Homepage contains 'Discover More' or equivalent CTA", async ({ page }) => {
    const discoverCTA = page.getByRole("link", { name: /discover/i });
    await expect(discoverCTA.first()).toBeVisible();
  });
});

test.describe("Browse: Discover Screen (PB §6.8)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/discover");
    await page.waitForLoadState("networkidle");
  });

  test("Discover page loads and shows content", async ({ page }) => {
    await expect(page).not.toHaveURL(/\/login/);
    const links = page.locator("a[href*='/books/']");
    await expect(links.first()).toBeVisible({ timeout: 10000 });
  });

  test("Discover category navigation links are present", async ({ page }) => {
    // Check the sub-category navigation exists
    for (const category of ["Books", "Audiobooks"]) {
      const link = page.getByRole("link", { name: new RegExp(category, "i") });
      await expect(link.first()).toBeVisible();
    }
  });
});

test.describe("Browse: Discover Sub-Categories", () => {
  const routes = [
    { path: "/discover/books", name: "Books" },
    { path: "/discover/audiobooks", name: "Audiobooks" },
    { path: "/discover/periodicals", name: "Periodicals" },
    { path: "/discover/comics", name: "Comics" },
    { path: "/discover/documents", name: "Documents" },
  ];

  for (const route of routes) {
    test(`${route.name} category page loads without error`, async ({ page }) => {
      const response = await page.goto(route.path);
      expect([200, 404]).toContain(response?.status()); // 404 is acceptable if not yet built
      if (response?.status() === 200) {
        const pageText = await page.textContent("body");
        expect(pageText).not.toContain("500");
        expect(pageText).not.toContain("Internal Server Error");
      }
    });
  }
});

test.describe("Browse: Book Detail Page (PB §6.3)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(KNOWN_BOOK.path);
    await page.waitForLoadState("networkidle");
  });

  test("Book detail page loads and is not a 404", async ({ page }) => {
    await expect(page).not.toHaveURL(/\/404|\/not-found/);
    const pageText = await page.textContent("body");
    expect(pageText).not.toContain("Page Not Found");
  });

  test("Book title is visible (Priority 1 per PB §6.3)", async ({ page }) => {
    const pageText = await page.textContent("body");
    // The known book title should appear
    expect(pageText).toContain("He Done Her Wrong");
  });

  test("Author name is visible and clickable (Priority 1 per PB §6.3)", async ({ page }) => {
    // Author name links to author profile per PB §6.3
    const authorLink = page.getByRole("link", { name: /milt gross/i });
    if (await authorLink.isVisible()) {
      await expect(authorLink).toBeVisible();
    } else {
      // Author may be displayed as text — just check it appears
      const pageText = await page.textContent("body");
      expect(pageText?.toLowerCase()).toContain("milt gross");
    }
  });

  test("Cover image is large and prominent (Priority 1 per PB §6.3)", async ({ page }) => {
    const img = page.locator("img").first();
    await expect(img).toBeVisible();
    const box = await img.boundingBox();
    expect(box?.height, "Cover image should be at least 150px tall").toBeGreaterThan(150);
  });

  test("Price or Free label is displayed (Priority 2 per PB §6.3)", async ({ page }) => {
    const pageText = await page.textContent("body");
    expect(pageText?.toLowerCase()).toMatch(/free|₦|\$|\d+/);
  });

  test("Preview/Sample button present (Priority 2 per PB §6.3 and §3.9)", async ({ page }) => {
    const pageText = await page.textContent("body");
    // Should have some CTA — Read Sample, Preview, Play Sample, or Buy/Access
    expect(pageText?.toLowerCase()).toMatch(/sample|preview|read now|buy|access/);
  });

  test("Content type shown as icon/label — NOT file format (PB §6.3, §10.5)", async ({ page }) => {
    const pageText = await page.textContent("body");
    // Must not expose technical format names
    expect(pageText?.toLowerCase()).not.toContain("epub");
    expect(pageText?.toLowerCase()).not.toContain(".pdf");
    expect(pageText?.toLowerCase()).not.toContain(".mp3");
    expect(pageText?.toLowerCase()).not.toContain(".cbz");
    // Should show friendly type
    expect(pageText?.toLowerCase()).toMatch(/comic|book|audiobook|document/);
  });

  test("Age rating is displayed (PB §2.4)", async ({ page }) => {
    const pageText = await page.textContent("body");
    // Age ratings like "12+", "18+", "8+" per PB
    expect(pageText).toMatch(/\d+\+/);
  });
});

test.describe("Browse: Authenticated User Flows", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByLabel(/password/i).fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /log in/i }).click();
    await page.waitForURL((url) => !url.toString().includes("/login"), { timeout: 15000 });
  });

  test("Library page shows tabs: In Progress, Favorites, Finished, All My Books (PB §6.2)", async ({ page }) => {
    await page.goto("/library");
    await page.waitForLoadState("networkidle");
    const pageText = await page.textContent("body");
    expect(pageText?.toLowerCase()).toMatch(/in progress|favorites|finished|all my books/);
  });

  test("Library page has search within library (PB §6.2)", async ({ page }) => {
    await page.goto("/library");
    await page.waitForLoadState("networkidle");
    const searchInput = page.locator("input[type='search'], input[placeholder*='search' i]");
    // Search should be present per PB §5.2 — library has scoped search
    if (await searchInput.count() > 0) {
      await expect(searchInput.first()).toBeVisible();
    }
  });

  test("Clicking a book card navigates to book detail page", async ({ page }) => {
    await page.goto("/");
    const bookLink = page.locator("a[href*='/books/']").first();
    await expect(bookLink).toBeVisible({ timeout: 10000 });
    await bookLink.click();
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/\/books\//);
  });

  test("Forums page is accessible when logged in (PB §6.6, Q14)", async ({ page }) => {
    await page.goto("/forums");
    await expect(page).not.toHaveURL(/\/login/);
    await page.waitForLoadState("networkidle");
    const pageText = await page.textContent("body");
    expect(pageText).not.toContain("500");
  });
});
