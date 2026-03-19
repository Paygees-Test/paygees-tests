/**
 * Paygees Test Helpers & Constants
 * Derived from Product Bible v4.5
 */

export const BASE_URL = "https://paygees-web.vercel.app";

// ─── TEST ACCOUNTS ──────────────────────────────────────────────────────────
// All credentials pulled from GitHub Secrets — never hardcoded.
// Each account is used for the specific tier/role tests it represents.

// Main account (general auth tests — should be Free tier)
export const TEST_EMAIL    = process.env.TEST_EMAIL    || "";
export const TEST_PASSWORD = process.env.TEST_PASSWORD || "";

// Free tier — browse, forums read/reply, no tokens (PB §1.3)
export const TEST_EMAIL_FREE    = process.env.TEST_EMAIL_FREE    || TEST_EMAIL;
export const TEST_PASSWORD_FREE = process.env.TEST_PASSWORD_FREE || TEST_PASSWORD;

// Basic tier — 1 token, 2 offline downloads, forums, ads always on (PB §1.3)
export const TEST_EMAIL_BASIC    = process.env.TEST_EMAIL_BASIC    || "";
export const TEST_PASSWORD_BASIC = process.env.TEST_PASSWORD_BASIC || "";

// Premium tier — 4 tokens, 10 downloads, ad control, priority support (PB §1.3)
export const TEST_EMAIL_PREMIUM    = process.env.TEST_EMAIL_PREMIUM    || "";
export const TEST_PASSWORD_PREMIUM = process.env.TEST_PASSWORD_PREMIUM || "";

// Publisher account — upload, catalog management, earnings dashboard (PB §2.2)
export const TEST_EMAIL_PUBLISHER    = process.env.TEST_EMAIL_PUBLISHER    || "";
export const TEST_PASSWORD_PUBLISHER = process.env.TEST_PASSWORD_PUBLISHER || "";

// Guardian account — manages child accounts, approves purchase requests (PB §2.3, §6.11)
export const TEST_EMAIL_GUARDIAN    = process.env.TEST_EMAIL_GUARDIAN    || "";
export const TEST_PASSWORD_GUARDIAN = process.env.TEST_PASSWORD_GUARDIAN || "";

// Child/Junior account — managed by Guardian, age-filtered catalog (PB §2.5)
export const TEST_EMAIL_CHILD    = process.env.TEST_EMAIL_CHILD    || "";
export const TEST_PASSWORD_CHILD = process.env.TEST_PASSWORD_CHILD || "";

// ─── LOGIN HELPER ───────────────────────────────────────────────────────────
// Reusable across all spec files.
// Usage: await loginAs(page, TEST_EMAIL_FREE, TEST_PASSWORD_FREE);
export async function loginAs(page: any, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /log in/i }).click();
  await page.waitForURL((url: URL) => !url.toString().includes("/login"), { timeout: 15000 });
}

// ─── BRAND COLOURS ──────────────────────────────────────────────────────────
// Per PB §10.2
export const BRAND = {
  PRIMARY:      "#1EAEDB",  // Only permitted primary — no substitutions
  PRIMARY_DARK: "#0FA0CE",
  PRIMARY_LIGHT:"#2BC4E8",
  SECONDARY:    "#E8735A",  // Coral — section headers + preview timer ONLY
  BACKGROUND:   "#FFFFFF",
  LIGHT_BG:     "#F5F5F5",
  TEXT_PRIMARY: "#000000",
  TEXT_SECONDARY:"#666666",
  RATINGS:      "#F5A623",
  SUCCESS:      "#4CAF50",
  ERROR:        "#E53935",
  BANNED_COLOR: "#2CB5B5", // Explicitly banned — must never appear anywhere
};

// ─── PUBLIC ROUTES ───────────────────────────────────────────────────────────
// Per PB §5.2
export const PUBLIC_ROUTES = [
  { path: "/",                      name: "Home" },
  { path: "/discover",              name: "Discover" },
  { path: "/discover/books",        name: "Discover Books" },
  { path: "/discover/audiobooks",   name: "Discover Audiobooks" },
  { path: "/discover/periodicals",  name: "Discover Periodicals" },
  { path: "/discover/comics",       name: "Discover Comics & Illustrations" },
  { path: "/discover/documents",    name: "Discover Documents & Research" },
  { path: "/news",                  name: "News" },
  { path: "/events",                name: "Events" },
  { path: "/forums",                name: "Forums" },
  { path: "/about",                 name: "About Paygees" },
  { path: "/help",                  name: "Help Centre" },
  { path: "/terms",                 name: "Terms of Service" },
  { path: "/privacy",               name: "Privacy Policy" },
  { path: "/contact",               name: "Contact Us" },
  { path: "/register",              name: "Sign Up" },
  { path: "/login",                 name: "Log In" },
  { path: "/forgot-password",       name: "Forgot Password" },
  { path: "/blog",                  name: "Blog" },
  { path: "/careers",               name: "Careers" },
  { path: "/press",                 name: "Press" },
];

// Auth-gated routes — must redirect unauthenticated users to /login
export const AUTH_GATED_ROUTES = [
  "/library",
  "/settings",
  "/forums",
];

// Nav items per PB §5.2
export const SIDEBAR_NAV = ["Home", "Library", "News", "Events", "Forums"];

// Discover sub-categories
export const DISCOVER_CATEGORIES = [
  "Books",
  "Audiobooks",
  "Periodicals",
  "Comics & Illustrations",
  "Documents & Research",
];

// Footer links per PB §5.2
export const FOOTER_LINKS = [
  "About Paygees",
  "Help Centre",
  "Terms",
  "Privacy Policy",
  "Contact",
  "Blog",
];

// Subscription tiers per PB §1.3
export const SUBSCRIPTION_TIERS = ["Free", "Junior", "Basic", "Standard", "Premium"];

// Tagline per PB header
export const TAGLINE = "Affordable | Accessible | Available";

// Page title pattern
export const SITE_TITLE_PATTERN = /Paygees/i;

// A known free book on the live site
export const KNOWN_BOOK = {
  id:    "fbf65705-b7d5-4c89-b6d0-81f44098fa26",
  title: "He Done Her Wrong",
  path:  "/books/fbf65705-b7d5-4c89-b6d0-81f44098fa26",
};

// Performance thresholds
export const PERF = {
  MAX_LOAD_TIME_MS: 5000,
  MAX_LCP_MS:       4000,
  MAX_FCP_MS:       3000,
  MAX_CLS:          0.1,
};
