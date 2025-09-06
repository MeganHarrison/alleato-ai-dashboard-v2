// tests/feature-validation.spec.js
import { test, expect } from "@playwright/test";

test.describe("Feature Implementation", () => {
  test("login form submits correctly", async ({ page }) => {
    await page.goto("/login");

    await page.fill("#email", "test@example.com");
    await page.fill("#password", "password123");
    await page.click('button[type="submit"]');

    // Actually verify the outcome
    await expect(page).toHaveURL("/dashboard");
    await expect(page.locator(".welcome-message")).toBeVisible();
  });

  test("API endpoint returns correct data", async ({ request }) => {
    const response = await request.get("/api/users");
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty("users");
    expect(Array.isArray(data.users)).toBeTruthy();
  });
});
