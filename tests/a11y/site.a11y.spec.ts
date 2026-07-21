import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("homepage has no detectable WCAG A or AA violations", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations).toEqual([]);
});

test("all critical routes and handoffs remain usable without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4173/");
  await expect(page.locator("[data-action-result]")).toHaveCount(6);
  for (const panel of await page.locator("[data-action-result]").all()) {
    await expect(panel).toBeVisible();
    await expect(panel.getByRole("link", { name: /external/i }).first()).toHaveAttribute("href", /^https:\/\//);
  }
  await expect(page.locator(".phase-list")).toBeVisible();
  await context.close();
});

test("mobile reflows without horizontal clipping", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/");
  const dimensions = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
  await expect(page.locator(".compact-rings")).toBeVisible();
  await expect(page.locator(".phase-list")).toBeVisible();
});

test("reduced motion removes smooth scrolling", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  expect(await page.locator("html").evaluate((node) => getComputedStyle(node).scrollBehavior)).toBe("auto");
});
