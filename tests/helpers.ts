/**
 * Paygees Test Helpers & Constants
 * Derived from Product Bible v4.5
 */

export const BASE_URL = "https://paygees-web.vercel.app";

// Test credentials — store as GitHub Secrets in CI
export const TEST_EMAIL = process.env.TEST_EMAIL || "test@paygees.com";
export const TEST_PASSWORD = process.env.TEST_PASSWORD || "Duckie90!@gmail.com";

// Brand colours per PB §10.2
export const BRAND = {
  PRIMARY: "#1EAEDB",
  PRIMARY_DARK: "#0FA0CE",
  PRIMARY_LIGHT: "#2BC4E8",
  SECONDARY: "#E8735A", // Coral — section headers + preview timer only
  BACKGROUND: "#FFFFFF",
  LIGHT_BG: "#F5F5F5",
  TEXT_PRIMARY: "#000000",
  TEXT_SECONDARY: "#666666",
  RATINGS: "#F5A623",
  SUCCESS: "#4CAF50",
  ERROR: "#E53935",
  BANNED_COLOR: "#2CB5B5", // Explicitly banned — must never appear
};

// All public routes per PB §5.2
export const PUBLIC_ROUTES = [
  { path: "/", name: "Home" },
  { path: "/discover", name: "Discover" },
  { path: "/discover/books", name: "Discover Books" },
  { path: "/discover/audiobooks", name: "Discover Audiobooks" },
  { path: "/discover/periodicals", name: "Discover Periodicals" },
  { path: "/discover/comics", name: "Discover Comics & Illustrations" },
  { path: "/discover/documents", name: "Discover Documents & Research" },
  { path: "/news", name: "News" },
  { path: "/events", name: "Events" },
  { path: "/forums", name: "Forums" },
  { path: "/about", name: "About Paygees" },
  { path: "/help", name: "Help Centre" },
  { path: "/terms", name: "Terms of Service" },
  { path: "/privacy", name: "Privacy Policy" },
  { path: "/contact", name: "Contact Us" },
  { path: "/register", name: "Sign Up" },
  { path: "/login", name: "Log In" },
  { path: "/forgot-password", name: "Forgot Password" },
  { path: "/blog", name: "Blog" },
  { path: "/careers", name: "Careers" },
  { path: "/press", name: "Press" },
];

// Auth-gated routes that must redirect to /login
export const AUTH_GATED_ROUTES = [
  "/library",
  "/settings",
];

// Nav items per PB §5.2 — must appear in left sidebar
export const SIDEBAR_NAV = ["Home", "Library", "News", "Events", "Forums"];

// Discover sub-categories per live site & PB §15
export const DISCOVER_CATEGORIES = [
  "Books",
  "Audiobooks",
  "Periodicals",
  "Comics & Illustrations",
  "Documents & Research",
];

// Footer columns per PB §5.2
export const FOOTER_LINKS = [
  "About Paygees",
  "Help Centre",
  "Terms",
  "Privacy Policy",
  "Contact",
  "Blog",
];

// Payment logos per PB §5.2 — VISA, Mastercard, AMEX (Verve, PayPal, Paystack in spec)
export const PAYMENT_LOGOS = ["VISA", "MC", "AMEX"];

// Subscription tiers per PB §1.3
export const SUBSCRIPTION_TIERS = ["Free", "Junior", "Basic", "Standard", "Premium"];

// Tagline per PB header
export const TAGLINE = "Affordable | Accessible | Available";

// Page title pattern
export const SITE_TITLE_PATTERN = /Paygees/i;

// A known free book on the live site (from homepage crawl)
export const KNOWN_BOOK = {
  id: "fbf65705-b7d5-4c89-b6d0-81f44098fa26",
  title: "He Done Her Wrong",
  path: "/books/fbf65705-b7d5-4c89-b6d0-81f44098fa26",
};

// Performance thresholds
export const PERF = {
  MAX_LOAD_TIME_MS: 5000,
  MAX_LCP_MS: 4000,
  MAX_FCP_MS: 3000,
  MAX_CLS: 0.1,
};
