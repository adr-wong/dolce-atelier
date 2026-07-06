import { test, expect } from "@playwright/test";

test.describe("Smoke tests", () => {
  test("homepage loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Dolce Atelier/i);
  });

  test("catalogo page loads", async ({ page }) => {
    await page.goto("/catalogo");
    await expect(page.locator("body")).toBeVisible();
  });

  test("recetas page loads", async ({ page }) => {
    await page.goto("/recetas");
    await expect(page.locator("body")).toBeVisible();
  });

  test("sobre-nosotros page loads", async ({ page }) => {
    await page.goto("/sobre-nosotros");
    await expect(page.locator("body")).toBeVisible();
  });

  test("contactenos page loads", async ({ page }) => {
    await page.goto("/contactenos");
    await expect(page.locator("body")).toBeVisible();
  });
});
