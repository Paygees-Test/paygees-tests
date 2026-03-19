/**
 * VERCEL DEPLOY HOOK → GITHUB ACTIONS TRIGGER
 *
 * Set this as a Vercel Deploy Hook in your Vercel project settings:
 *   Project Settings → Git → Deploy Hooks → Create Hook
 *
 * Then add a webhook in Vercel that POSTs to GitHub's repository_dispatch API.
 * This file documents the setup — paste the GitHub API call into Vercel's
 * "Deploy Hook" → "Post-deployment webhook" field or use a serverless function.
 *
 * ─── SETUP INSTRUCTIONS ───
 *
 * Option A: Vercel → GitHub repository_dispatch (recommended)
 *
 * In your Paygees Vercel project:
 *   1. Go to Project Settings → Git → Deploy Hooks
 *   2. Create a hook named "Trigger Production Tests"
 *   3. Under "Post-deployment webhooks" paste the URL below
 *      (replace GITHUB_TOKEN and REPO values):
 *
 *   POST https://api.github.com/repos/YOUR_GITHUB_USER/paygees-tests/dispatches
 *   Headers:
 *     Authorization: Bearer YOUR_GITHUB_PAT
 *     Accept: application/vnd.github+json
 *   Body:
 *     { "event_type": "vercel-deployment-complete" }
 *
 * Option B: Use this as a Next.js API route in your Paygees app (paygees-web)
 *
 * Create: /app/api/deploy-hook/route.ts
 *
 * export async function POST(req: Request) {
 *   const secret = req.headers.get("x-vercel-signature");
 *   // Validate Vercel signature here if needed
 *
 *   await fetch(
 *     "https://api.github.com/repos/YOUR_GITHUB_USER/paygees-tests/dispatches",
 *     {
 *       method: "POST",
 *       headers: {
 *         Authorization: `Bearer ${process.env.GITHUB_PAT}`,
 *         Accept: "application/vnd.github+json",
 *         "Content-Type": "application/json",
 *       },
 *       body: JSON.stringify({ event_type: "vercel-deployment-complete" }),
 *     }
 *   );
 *
 *   return Response.json({ ok: true });
 * }
 *
 * ─── GITHUB SECRETS TO ADD ───
 *
 * In your paygees-tests GitHub repo → Settings → Secrets → Actions:
 *
 * Secret Name             Value
 * ──────────────────────  ─────────────────────────────────────────
 * TEST_EMAIL              test@paygees.com
 * TEST_PASSWORD           Duckie90!@gmail.com
 * NOTIFY_EMAIL_USER       your-gmail@gmail.com
 * NOTIFY_EMAIL_PASS       your-gmail-app-password (not regular password)
 * NOTIFY_EMAIL_TO         bade@paygees.com (where failure alerts go)
 * SLACK_WEBHOOK_URL       (optional) your Slack incoming webhook URL
 *
 * ─── GITHUB PAGES SETUP ───
 *
 * 1. Go to your paygees-tests repo → Settings → Pages
 * 2. Source: Deploy from a branch
 * 3. Branch: gh-pages / root
 * 4. Your report will be live at:
 *    https://YOUR_GITHUB_USER.github.io/paygees-tests/allure-report
 *
 * This URL is permanent, always shows the latest run, and has history graphs.
 */

export {};
