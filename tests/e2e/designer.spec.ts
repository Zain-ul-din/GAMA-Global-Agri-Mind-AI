import { expect, test } from "@playwright/test";

test("designer shell exposes only working navigation", async ({
  page,
  isMobile,
}) => {
  await page.goto("/design");
  if (isMobile) {
    await expect(page.getByLabel("Open garden setup")).toBeVisible();
    await page.getByLabel("Open navigation").click();
    await expect(
      page.getByRole("navigation", { name: "Designer navigation" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Garden setup" }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
  } else {
    await expect(page.getByText("Garden designer")).toBeVisible();
    const navigation = page.getByRole("navigation", {
      name: "Designer navigation",
    });
    await expect(
      navigation.getByRole("button", { name: "Garden setup" }),
    ).toBeVisible();
    await expect(
      navigation.getByRole("button", { name: "Trace site" }),
    ).toBeVisible();
    await expect(
      navigation.getByRole("button", { name: "Calendar" }),
    ).toBeDisabled();
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
