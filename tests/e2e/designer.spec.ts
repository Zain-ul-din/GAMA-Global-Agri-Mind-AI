import { expect, test } from "@playwright/test";

test("designer shell exposes only working navigation", async ({
  page,
  isMobile,
}) => {
  await page.goto("/design");
  if (isMobile) {
    await expect(page.getByLabel("Open garden setup")).toBeVisible();
  } else {
    await expect(page.getByText("Garden designer")).toBeVisible();
  }
  await expect(page.getByText("Plot workspace")).toBeVisible();
  await expect(page.getByText("Expert Hub")).toHaveCount(0);
  await expect(page.getByText("Partly Cloudy")).toHaveCount(0);
});

test("theme choice persists", async ({ page }) => {
  await page.goto("/design");
  await page.getByLabel("Choose theme").click();
  await page.getByText("Dark", { exact: true }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
});
