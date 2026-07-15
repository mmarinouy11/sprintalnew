import { test, expect } from "@playwright/test";

/**
 * Smoke test — proves the skeleton boots and serves the root route and the
 * reference API route. Feature specs are added alongside this as UI lands.
 */
test("home route renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Sprintal" })).toBeVisible();
});

test("health API route responds ok", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.ok()).toBeTruthy();
  await expect(res.json()).resolves.toMatchObject({ status: "ok" });
});
