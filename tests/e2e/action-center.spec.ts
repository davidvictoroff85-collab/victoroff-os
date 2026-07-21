import { expect, test } from "@playwright/test";

const tasks = [
  ["Distribution / records", "distribution-records"],
  ["Forms / stock wills", "forms-stock-wills"],
  ["Descendant enrollment", "descendant-enrollment"],
  ["Jobs / training / scholarships", "jobs-training-scholarships"],
  ["Voting", "voting"],
  ["Local assistance", "local-assistance"],
] as const;

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("all six shareholder journeys reveal one prepared external handoff", async ({ page }) => {
  for (const [label, id] of tasks) {
    await page.getByRole("tab", { name: label }).click();
    const panel = page.locator(`[data-action-result="${id}"]`);
    await expect(panel).toBeVisible();
    await expect(panel.getByRole("heading", { name: /Verified rule/ })).toBeVisible();
    await expect(panel.getByRole("heading", { name: /Prepare/ })).toBeVisible();
    const handoff = panel.getByRole("link", { name: /external/i }).first();
    await expect(handoff).toHaveAttribute("href", /^https:\/\//);
    await expect(panel).toContainText(/Human fallback/);
    await expect(panel.locator(".source-ledger")).toContainText(/Reviewed 2026-07-21/);
  }
});

test("tabs work from the keyboard", async ({ page }) => {
  const first = page.getByRole("tab", { name: "Distribution / records" });
  await first.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Forms / stock wills" })).toBeFocused();
  await expect(page.locator('[data-action-result="forms-stock-wills"]')).toBeVisible();
});

test("the concentric system exposes each ring", async ({ page }) => {
  await page.locator("#system").scrollIntoViewIfNeeded();
  for (const ring of ["guide", "connect", "operate", "rebuild", "own", "center"]) {
    await page.locator(`[data-ring="${ring}"] span`).click();
    await expect(page.locator(`[data-ring="${ring}"]`)).toHaveAttribute("aria-pressed", "true");
  }
});

test("the public proof leaves browser storage and cookies empty", async ({ page, context }) => {
  await page.getByRole("tab", { name: "Voting" }).click();
  const storage = await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }));
  expect(storage).toEqual({ local: 0, session: 0 });
  expect(await context.cookies()).toHaveLength(0);
});

test("focus uses visible black-white inversion", async ({ page }) => {
  const button = page.getByRole("tab", { name: "Distribution / records" });
  await button.focus();
  const styles = await button.evaluate((element) => {
    const computed = getComputedStyle(element);
    return { color: computed.color, background: computed.backgroundColor, outline: computed.outlineStyle };
  });
  expect(styles.color).toBe("rgb(255, 255, 255)");
  expect(styles.background).toBe("rgb(0, 0, 0)");
  expect(styles.outline).not.toBe("none");
});
