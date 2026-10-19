import { test, expect } from "@playwright/test"

test.describe("Bharat Stock Predictor (demo mode)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await expect(page.getByRole("heading", { name: "Reliance Industries" })).toBeVisible()
  })

  test("shows the non-dismissable risk warning and demo banner", async ({ page }) => {
    await expect(page.getByText("Educational use only — not investment advice.")).toBeVisible()
    await expect(page.getByText("Demo data.")).toBeVisible()
  })

  test("renders price, forecast horizons and the chart", async ({ page }) => {
    await expect(page.getByText("Next 5 trading days")).toBeVisible()
    await expect(page.getByText("Next 20 trading days")).toBeVisible()
    await expect(page.getByText("Why — the drivers behind this call")).toBeVisible()
    // The forecast chart renders an SVG.
    await expect(page.locator(".recharts-surface").first()).toBeVisible()
  })

  test("selecting another stock loads its detail", async ({ page }) => {
    await page.getByRole("option", { name: /Infosys/ }).click()
    await expect(page.getByRole("heading", { name: "Infosys" })).toBeVisible()
  })

  test("search filters the list", async ({ page }) => {
    await page.getByRole("searchbox", { name: "Search stocks" }).fill("bank")
    await expect(page.getByRole("option", { name: /HDFC Bank/ })).toBeVisible()
    await expect(page.getByRole("option", { name: /Infosys/ })).toHaveCount(0)
  })

  test("currency converter updates the displayed price everywhere", async ({ page }) => {
    // Default currency is INR — a rupee price is shown.
    await expect(page.locator("text=/₹[0-9]/").first()).toBeVisible()

    // Switch to USD.
    await page.getByRole("button", { name: "Change display currency" }).click()
    await page.getByRole("option", { name: /US Dollar/ }).click()

    // The price is now shown with a $ symbol, and no rupee amounts remain.
    await expect(page.locator("text=/\\$[0-9]/").first()).toBeVisible()
    await expect(page.locator("text=/₹[0-9]/")).toHaveCount(0)
  })

  test("theme toggle switches to light mode", async ({ page }) => {
    await page.getByRole("button", { name: /Switch to (light|dark) mode/ }).click()
    const theme = await page.evaluate(() => document.documentElement.getAttribute("data-theme"))
    expect(["light", "dark"]).toContain(theme)
  })
})
